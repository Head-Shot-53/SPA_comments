from lxml import etree, html

ALLOWED_TAGS = {"a","code","i","strong"}
ALLOWED_ATTRS = {"a": {"href","title"}}

def sanitize_and_xhtml(raw: str) -> str:
    doc = html.fromstring(raw or "")
    # залишаємо тільки дозволені теги/атрибути
    for el in list(doc.iter()):
        tag = el.tag if isinstance(el.tag, str) else None
        if not tag or tag.lower() not in ALLOWED_TAGS:
            el.drop_tag()  # заміняє тег на його вміст
            continue
        # лишаємо лише дозволені атрибути
        allowed = ALLOWED_ATTRS.get(tag.lower(), set())
        for a in list(el.attrib):
            if a.lower() not in allowed:
                el.attrib.pop(a, None)
    # cеріалізація як XHTML 
    return etree.tostring(doc, method="xml", encoding="unicode")
