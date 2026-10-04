from medapoyo_pipeline.normalize import canonical_ingredient, medication_key, norm_text, normalize_form, normalize_strength


def test_norm_text_quita_tildes_y_mayusculas():
    assert norm_text("  Ácido   Acetilsalicílico ") == "acido acetilsalicilico"


def test_sinonimos_regionales():
    assert canonical_ingredient("Paracetamol") == canonical_ingredient("Acetaminofén") == "acetaminofen"
    assert canonical_ingredient("Dipirona") == "metamizol"


def test_concentraciones():
    assert normalize_strength("500 MG") == "500 mg"
    assert normalize_strength("500mg") == "500 mg"
    assert normalize_strength("1 gr / 10 cc") == "1 g/10 mL"
    assert normalize_strength("120 mg por 5 mL") == "120 mg/5 mL"
    assert normalize_strength("0,5 g") == "0.5 g"
    assert normalize_strength("100 UI/mL") == "100 UI/mL"
    assert normalize_strength("250 mcg c/u") == "250 mcg"


def test_formas():
    assert normalize_form("TAB") == "tableta"
    assert normalize_form("Cápsulas") == "cápsula"
    assert normalize_form("solucion inyectable") == "solución inyectable"


def test_clave_igual_entre_listados():
    a = medication_key(["Paracetamol"], "Tabletas", "500 MG")
    b = medication_key(["acetaminofén"], "tableta", "500 mg")
    assert a == b


def test_clave_distinta_si_cambia_concentracion_o_forma():
    base = medication_key(["acetaminofén"], "tableta", "500 mg")
    assert base != medication_key(["acetaminofén"], "tableta", "1 g")
    assert base != medication_key(["acetaminofén"], "suspensión oral", "500 mg")
