# Automatic shop holiday closures

Scope: requested recurring holidays and substitutes, using the public-holiday regulation effective 2026-05-11. Lunar conversion: korean-lunar-calendar 0.4.0, pinned, offline. Supported calendar range: opening date through 2050-12-31.

Monthly API returns the shared holiday map; Home weekly rendering uses the same module. No database records are inserted. Holidays suppress synthesized free-visit slots. Explicit admin opening/closure/events retain precedence. Regular Sunday/Monday closures do not create an extra shop-specific substitute Tuesday.

One-off government holidays/election days and future legal changes are not inferred; register them through existing admin closure entries or update the rules. January 1 and Memorial Day have no substitute. Seollal/Chuseok Saturday alone does not trigger a substitute.

Validation: node holidays-check.cjs and node home-check.cjs.
Sources: https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1029728081 and https://astro.kasi.re.kr/kor/life/post/calendarData?year=2027
