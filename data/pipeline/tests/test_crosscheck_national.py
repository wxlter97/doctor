from medapoyo_pipeline.crosscheck_national import _nums, compare


def _m(id_, name, strength, atc):
    return {"id": id_, "genericName": name, "activeIngredients": [name], "strength": strength, "atcCode": atc}


def test_numeros_comparables_entre_notaciones():
    assert _nums("0.50%") == _nums("0.5%") == {0.5}
    assert _nums("1,500 UI") == {1500.0}
    assert _nums("25 mg,100 mg") == {25.0, 100.0}


def test_compara_nombre_concentracion_y_faltantes():
    meds = [_m("a", "Amlodipina", "5 mg", "C08CA01"), _m("b", "Tiamina Clorhidrato", "100 mg/mL", "A11DA01"), _m("c", "Captopril", "25 mg", None)]
    nat = [
        {"atc": "C08CA01", "nombre": "Amlodipina", "concentracion": "5 mg"},
        {"atc": "C08CA01", "nombre": "Amlodipino", "concentracion": "10 mg"},
        {"atc": "A11DA01", "nombre": "Vitamina B1 (Tiamina)", "concentracion": "100 mg/mL"},
        {"atc": "C09AA01", "nombre": "Captopril", "concentracion": "25 mg"},
        {"atc": "Z99ZZ99", "nombre": "Fármaco inexistente", "concentracion": "1 mg"},
    ]
    res = [r["resultado"] for r in compare(nat, meds)]
    assert res == ["COINCIDE", "CONCENTRACION_NO_ENCONTRADA", "COINCIDE", "FICHA_SIN_ATC", "POSIBLE_FALTANTE"]
