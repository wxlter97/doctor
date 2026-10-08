from medapoyo_pipeline import isss
from medapoyo_pipeline.combine import combine, compatible, ingredient_key, physical_state, route_class, strength_key


def row(**kw):
    base = dict(page=60, code="8010418", name="Albendazol", strength="200 mg", form="Tableta", presentation="Empaque primario individual",
                nivel="G", prioridad="2", despacho="1 A", group="ANTIPARASITARIOS")
    base.update(kw)
    return isss.IsssRow(**base)


def test_parse_basico():
    p = isss.parse(row())
    assert (p["name"], p["strength"], p["form"], p["route"]) == ("Albendazol", "200 mg", "Tableta", "oral")
    assert p["careLevel"] == "Despacho 1 A · Esencial · Prescripción: Médico general"
    assert p["group"] == "Antiparasitarios" and not p["flags"]


def test_parse_concentracion_embebida_y_sin_concentracion():
    p = isss.parse(row(name="Vitamina A + C + D CONCENTRACIÓN: (1,500 - 2,500) UI + (30 - 60) mg", strength="", form="Solución Oral"))
    assert p["name"] == "Vitamina A + C + D" and p["strength"].startswith("(1,500")
    q = isss.parse(row(name="Bentonita A", strength="", form="Polvo"))
    assert q["strength"] == "Sin concentración"
    assert isss.parse(row(form="")) ["form"] == "No especificada"


def test_notas_se_conservan_con_su_etiqueta():
    r = row()
    r.notes = {"Regulación": "Uso Bajo Protocolo", "Especialidad": "Infectología."}
    assert isss.parse(r)["notes"] == "Regulación: Uso Bajo Protocolo. Especialidad: Infectología."


def test_claves_de_cruce():
    assert ingredient_key(["Calcio Gluconato"]) == ingredient_key(["Gluconato de Calcio"])
    assert ingredient_key(["Ertapenem (sódico)"]) == ingredient_key(["Ertapenem"])
    assert strength_key("(150 + 150) mg") == strength_key("150 mg+150 mg")
    assert strength_key("1,500 UI") == strength_key("1500 UI")
    assert physical_state("Tableta Recubierta") == "sólido" == physical_state("Sólido Oral")
    assert physical_state("Solución Inyectable") == "líquido" == physical_state("Líquido Parenteral")
    assert physical_state("Solución Inyectable o Polvo para Dilución I.V.") is None
    assert compatible(None, "sólido") and not compatible("sólido", "líquido")
    assert route_class("I.V.", "Solución Inyectable") == "parenteral" == route_class(None, "Líquido Parenteral")


def _minsal(id_, name, strength, form, route):
    return {"id": id_, "genericName": name, "activeIngredients": [name], "form": form, "strength": strength, "route": route,
            "searchTerms": [], "institutions": [{"id": "minsal", "code": "0010"}]}


def test_cruce_exacto_no_fusiona_por_parecido():
    cat = {"version": 2, "institutions": [{"id": "minsal"}], "medications": [
        _minsal("minsal-1", "Albendazol", "200 mg", "Sólido Oral", "oral"),
        _minsal("minsal-2", "Albendazol", "400 mg", "Sólido Oral", "oral"),
    ]}
    rows = [isss.parse(row()), isss.parse(row(code="8010419", strength="500 mg"))]
    out, review, stats = combine(cat, rows)
    by = {m["id"]: m for m in out["medications"]}
    assert [i["id"] for i in by["minsal-1"]["institutions"]] == ["minsal", "isss"]  # coincide exacto
    assert [i["id"] for i in by["minsal-2"]["institutions"]] == ["minsal"]  # otra concentración: no se fusiona
    assert "isss-8010419" in by and stats["isss_fichas_propias"] == 1
    assert any(r["isss_codigo"] == "8010419" for r in review)  # mismo principio activo → a revisión humana
    assert [i["id"] for i in out["institutions"]] == ["minsal", "isss"]


def test_estado_fisico_incompatible_no_fusiona():
    cat = {"version": 2, "institutions": [{"id": "minsal"}], "medications": [_minsal("minsal-1", "Aciclovir", "250 mg", "Sólido Parenteral", "I.V.")]}
    out, _, stats = combine(cat, [isss.parse(row(name="Aciclovir", strength="250 mg", form="Solución Inyectable I.V.", code="8010336"))])
    assert stats["isss_en_ficha_minsal"] == 0 and len(out["medications"]) == 2


def test_fosalud_atc_y_concentracion_ocr():
    from medapoyo_pipeline.combine import strength_ok
    from medapoyo_pipeline.fosalud import fix_atc

    assert fix_atc("ROGABO4") == "R06AB04" and fix_atc("RO3ACO2") == "R03AC02"
    assert strength_ok("100,000 Ul/mL", "100,000 UI/mL") and strength_ok("1,000 meg/mL", "1,000 mcg/mL")
    assert not strength_ok("5%", "50%")  # distinto número: no se asocia
    assert strength_ok("ar", "3%")  # ilegible: no contradice
    assert not strength_ok("500 mg", "250 mg")


def test_fosalud_solo_se_une_con_pareja_segura():
    from medapoyo_pipeline import fosalud

    fr = fosalud.FosRow(30, "00101005", "P02CA01", "Mebendazol", "100 mg", "Tableta", "Empaque Primario Individual", "G", notes={"Regulación": "Uso en niños."})
    unknown = fosalud.FosRow(30, "09999999", "", "Fármaco inventado", "7 mg", "Tableta", "", "G")
    cat = {"version": 2, "institutions": [{"id": "minsal"}], "medications": [{**_minsal("minsal-1", "Mebendazol", "100 mg", "Sólido Oral", "oral"), "institutions": [{"id": "minsal", "code": "00101005"}]}]}
    out, _, stats = combine(cat, [], [fosalud.parse(fr), fosalud.parse(unknown)])
    ids = [i["id"] for i in out["medications"][0]["institutions"]]
    assert ids == ["minsal", "fosalud"] and len(out["medications"]) == 1  # lo sin pareja no se publica
    assert "OCR" in out["medications"][0]["institutions"][1]["notes"] and stats["fosalud_sin_publicar"] == 1
    assert "presentation" not in out["medications"][0]["institutions"][1]


def test_decision_humana_manda_sobre_la_regla_automatica():
    cat = {"version": 2, "institutions": [{"id": "minsal"}], "medications": [_minsal("minsal-1", "Mebendazol", "100 mg", "Sólido Oral", "oral")]}
    r = isss.parse(row(code="8140301", name="Mebendazole", strength="100 mg", form="Tableta"))
    sin, _, _ = combine(cat, [r])
    assert len(sin["medications"]) == 2  # el nombre difiere: la regla automática no los une
    con, _, st = combine(cat, [r], decisions={"8140301": "minsal-1"})
    assert len(con["medications"]) == 1 and [i["id"] for i in con["medications"][0]["institutions"]] == ["minsal", "isss"] and st["isss_por_decision_humana"] == 1
