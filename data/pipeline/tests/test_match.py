from medapoyo_pipeline.match import Row, merge_rows, write_review_csv


def row(inst, name, ing, form, strength, **kw):
    return Row(institution=inst, name=name, ingredients=ing, form=form, strength=strength, **kw)


def test_mismo_medicamento_en_dos_listados_se_fusiona_con_presentaciones_separadas():
    rows = [
        row("minsal", "Acetaminofén", ["Acetaminofén"], "Tableta", "500 mg", presentation="caja × 10"),
        row("isss", "Paracetamol", ["Paracetamol"], "tabletas", "500 MG", presentation="frasco × 100"),
    ]
    safe, review = merge_rows(rows)
    assert len(safe) == 1 and not review
    assert {r.institution: r.presentation for r in safe[0].rows} == {"minsal": "caja × 10", "isss": "frasco × 100"}


def test_concentraciones_distintas_son_medicamentos_distintos():
    rows = [row("minsal", "A", ["acetaminofén"], "tableta", "500 mg"), row("minsal", "A", ["acetaminofén"], "tableta", "1 g")]
    safe, review = merge_rows(rows)
    assert len(safe) == 2 and not review


def test_ingredientes_parecidos_pero_distintos_van_a_revision_y_no_se_publican(tmp_path):
    rows = [
        row("minsal", "Amoxicilina", ["amoxicilina"], "cápsula", "500 mg"),
        row("isss", "Amoxicilina", ["amoxicilina trihidrato"], "cápsula", "500 mg"),
    ]
    safe, review = merge_rows(rows)
    assert len(safe) == 1 and len(review) == 1
    assert review[0].row.institution == "isss"
    out = tmp_path / "review.csv"
    write_review_csv(review, out)
    assert "amoxicilina trihidrato" not in out.read_text().split("\n")[0]
    assert out.read_text().count("\n") == 2


def test_ingredientes_distintos_no_generan_revision():
    rows = [row("minsal", "A", ["enalapril"], "tableta", "10 mg"), row("minsal", "B", ["losartán"], "tableta", "10 mg")]
    safe, review = merge_rows(rows)
    assert len(safe) == 2 and not review
