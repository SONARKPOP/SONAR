"""Shared name boundaries; offsets always refer to the unchanged source title."""
import re
from functools import lru_cache

PARTICLES=('에게','에서','이랑','까지','의','은','는','이','가','을','를','와','과','도','님','랑','만')
@lru_cache(maxsize=8192)
def alias_pattern(alias):
 if alias.isascii():return re.compile(r'(?<![\w])'+re.escape(alias)+r'(?![\w])',re.I)
 suffix=r'(?:'+ '|'.join(PARTICLES)+')'
 return re.compile(r'(?<![^\W_])'+re.escape(alias)+r'(?:'+suffix+r'(?![^\W_])|(?![^\W_]))',re.I)
def mentions(text,alias):return bool(alias_pattern(alias).search(text))
def mention_spans(text,alias):
 return [{'start':m.start(),'end':m.start()+len(alias),'text':text[m.start():m.start()+len(alias)],'source':'title'} for m in alias_pattern(alias).finditer(text)]
