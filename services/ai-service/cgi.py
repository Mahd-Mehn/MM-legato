"""
Mock cgi module for Python 3.13 compatibility
"""
import urllib.parse

def parse_header(line):
    """Parse a Content-type like header."""
    parts = line.split(';')
    main_type = parts[0].strip()
    pdict = {}
    for p in parts[1:]:
        i = p.find('=')
        if i >= 0:
            name = p[:i].strip().lower()
            value = p[i+1:].strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
                value = value[1:-1]
            pdict[name] = value
    return main_type, pdict