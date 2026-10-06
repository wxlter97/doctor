from pathlib import Path

import pytest

from medapoyo_pipeline.minsal import PDF_NAME, build_catalog, clean_atc, extract_rows, parse_description, RawRow

# Descripciones tomadas tal cual del LOM/MINSAL 2026 (Acuerdo n.º 1201).


def test_caso_simple():
    p = parse_description("Dicloxacilina (Sódica) 250 mg Sólido Oral Empaque Primario Individual")
    assert (p.name, p.strength, p.form, p.route) == ("Dicloxacilina (Sódica)", "250 mg", "Sólido Oral", "oral")
    assert p.ingredients == ["Dicloxacilina"] and p.search_terms == ["sódica"]
    assert p.presentation == "Empaque Primario Individual" and p.confidence == "alta"


def test_sinonimo_entre_parentesis_queda_buscable():
    p = parse_description("Acetaminofén (Paracetamol) 120 mg/5 mL Líquido Oral Frasco (100 -120) mL, con dosificador graduado")
    assert p.name == "Acetaminofén (Paracetamol)" and p.search_terms == ["paracetamol"]
    assert p.strength == "120 mg/5 mL" and p.form == "Líquido Oral"


def test_via_parenteral_se_extrae_de_la_presentacion():
    p = parse_description("Penicilina G (Benzatínica) 1.2 MUI Sólido Parenteral I.M. Frasco Vial con o sin diluyente")
    assert p.strength == "1.2 MUI" and p.form == "Sólido Parenteral" and p.route == "I.M."
    p = parse_description("Biperideno Lactato 5 mg/mL Líquido Parenteral I.M. - I.V. Ampolla 1 mL, protegida de la luz")
    assert p.route == "I.M./I.V."


def test_combinaciones_con_concentracion_entre_parentesis():
    p = parse_description("Trimetoprim + Sulfametoxazol (160 + 800) mg Sólido Oral Empaque Primario Individual, protegido de la luz")
    assert p.ingredients == ["Trimetoprim", "Sulfametoxazol"] and p.strength == "(160 + 800) mg" and p.form == "Sólido Oral"
    p = parse_description("Ampicilina (Sódica) + Sulbactam (Sódico) (1,000 + 500) mg Sólido Parenteral I.M. - I.V. Frasco Vial")
    assert p.ingredients == ["Ampicilina", "Sulbactam"] and p.strength == "(1,000 + 500) mg"  # la coma es de miles: no se toca


def test_formas_compuestas():
    assert parse_description("Morfina Sulfato o Clorhidrato 30 mg Sólido de Liberación Prolongada Oral Empaque Primario Individual").form == "Sólido de Liberación Prolongada Oral"
    assert parse_description("Ácido Valproico o Valproato de Sodio 500 mg Sólido con Cubierta Entérica Oral Empaque Primario Individual o Frasco").form == "Sólido con Cubierta Entérica Oral"
    assert parse_description("Tocilizumab 20 mg/mL Concentrado Líquido Parenteral para perfusión I.V. Frasco Vial 10 mL").form.startswith("Concentrado Líquido Parenteral")


def test_sin_concentracion_declarada():
    p = parse_description("Agua Estéril Líquido Parenteral Ampolla 10 mL")
    assert p.name == "Agua Estéril" and p.strength == "Sin concentración" and p.form == "Líquido Parenteral" and p.presentation == "Ampolla 10 mL"
    p = parse_description("Cold cream (Crema Fría) Semisólido Tópico Tarro (250 - 500) g")
    assert p.name == "Cold cream (Crema Fría)" and p.form == "Semisólido Tópico"  # «Crema» entre paréntesis no es la forma


def test_nombre_con_cifra_al_final_de_token_no_corta():
    p = parse_description("Dióxido de Carbono (CO2) 99.9% Gas Medicinal Inhalatoria 22.7 kg (50 lb), Cilindro")
    assert p.name == "Dióxido de Carbono (CO2)" and p.strength == "99.9%"


def test_lo_irreconocible_se_conserva_y_se_marca_para_revision():
    d = "Vacuna Antihepatitis B Parenteral I.M. fco. 1 dosis 5ml Pediátrica"
    p = parse_description(d)
    assert p.confidence == "baja" and p.presentation == d  # nada se pierde


def test_atc_y_notas_al_pie():
    assert clean_atc("P01AB01 *(1)") == ("P01AB01", "1")
    assert clean_atc("JO1DD08 *(2)") == ("J01DD08", "2")  # la O era un cero
    assert clean_atc("C07AG") == ("C07AG", None)
    assert clean_atc("") == (None, None)


def _row(sinab, desc, atc="N02BE01", nivel="1A", prio="Esencial", reg=""):
    return RawRow(11, "1", sinab, atc, desc, "C/U", prio, nivel, reg)


def test_catalogo_fusiona_presentaciones_y_no_repite_ids():
    rows = [
        _row("00000001", "Acetaminofén 500 mg Sólido Oral Empaque Primario Individual"),
        _row("00000002", "Acetaminofén 500 mg Sólido Oral Frasco por 100", nivel="1B"),
        _row("00000003", "Insulina A 100 UI/mL Líquido Parenteral S.C. Frasco Vial"),
        _row("00000003", "Insulina B 100 UI/mL Líquido Parenteral S.C. Frasco Vial"),  # código repetido en el PDF
    ]
    cat, review = build_catalog(rows, {"00": "MEDICAMENTOS DE PRUEBA"})
    ids = [m["id"] for m in cat["medications"]]
    assert len(ids) == len(set(ids)) == 3
    ac = next(m for m in cat["medications"] if m["genericName"] == "Acetaminofén")
    assert ac["institutions"][0]["code"] == "00000001, 00000002"
    assert ac["institutions"][0]["careLevel"] == "Nivel 1A · Esencial / Nivel 1B · Esencial"
    assert ac["therapeuticGroup"] == "Medicamentos de prueba"
    assert any("repetido" in r["motivo"] for r in review)
    assert cat["source"] == "PARCIAL" and cat["institutions"][0]["id"] == "minsal"


def test_regulacion_de_prescripcion_va_a_notas():
    cat, _ = build_catalog([_row("00000009", "Albendazol 200 mg Sólido Oral Empaque Primario Individual", reg="USO EXCLUSIVO PARA: Neurología")], {})
    assert "USO EXCLUSIVO PARA" in cat["medications"][0]["institutions"][0]["notes"]


PDF = Path(__file__).resolve().parents[3] / "data/sources" / PDF_NAME


@pytest.mark.skipif(not PDF.exists(), reason="el PDF no está en data/sources (no se versiona)")
def test_pdf_real_extrae_todo_el_listado():
    rows, groups = extract_rows(PDF)
    assert len(rows) == 834  # LOM/MINSAL 2026, Acuerdo 1201: si cambia, revisar el extractor
    assert len(groups) >= 35
    cat, review = build_catalog(rows, groups)
    assert 780 <= len(cat["medications"]) <= 834
    assert len(review) < 0.15 * len(rows)
    assert all(m["institutions"][0]["code"] for m in cat["medications"])
