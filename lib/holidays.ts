/**
 * Public holidays for Rhineland-Palatinate (Rheinland-Pfalz), Germany.
 *
 * Fixed holidays (11):
 *   Neujahr, Karfreitag*, Ostermontag*, Tag der Arbeit,
 *   Christi Himmelfahrt*, Pfingstmontag*, Fronleichnam* (RLP),
 *   Tag der Deutschen Einheit, Allerheiligen (RLP),
 *   1. + 2. Weihnachtstag
 *
 *  * = moveable, computed from Easter Sunday via the Gaussian algorithm.
 */

function easterSunday(year: number): Date {
  // Butcher / Gaussian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type Holiday = { date: string; name: string };

/** Returns all RLP public holidays for the given year, sorted by date. */
export function getHolidaysRLP(year: number): Holiday[] {
  const easter = easterSunday(year);

  const holidays: Holiday[] = [
    { date: `${year}-01-01`,             name: "Neujahr"                   },
    { date: fmt(addDays(easter, -2)),    name: "Karfreitag"                },
    { date: fmt(addDays(easter,  1)),    name: "Ostermontag"               },
    { date: `${year}-05-01`,             name: "Tag der Arbeit"            },
    { date: fmt(addDays(easter, 39)),    name: "Christi Himmelfahrt"       },
    { date: fmt(addDays(easter, 50)),    name: "Pfingstmontag"             },
    { date: fmt(addDays(easter, 60)),    name: "Fronleichnam"              },
    { date: `${year}-10-03`,             name: "Tag der Deutschen Einheit" },
    { date: `${year}-11-01`,             name: "Allerheiligen"             },
    { date: `${year}-12-24`,             name: "Heiligabend"               },
    { date: `${year}-12-25`,             name: "1. Weihnachtstag"          },
    { date: `${year}-12-26`,             name: "2. Weihnachtstag"          },
    { date: `${year}-12-31`,             name: "Silvester"                 },
  ];

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}

/** Returns a Set<"YYYY-MM-DD"> covering all years touched by [startDate, endDate]. */
export function getHolidaySet(startDate: Date, endDate: Date): Set<string> {
  const set = new Set<string>();
  const y0 = startDate.getUTCFullYear();
  const y1 = endDate.getUTCFullYear();
  for (let y = y0; y <= y1; y++) {
    for (const h of getHolidaysRLP(y)) set.add(h.date);
  }
  return set;
}
