function toYMD(date) {
    return date.toISOString().slice(0, 10)
  }
  
  // Tuesday-start week.
  // Example:
  // week_start = 2026-03-03 (Tuesday)
  // week_end   = 2026-03-09 (Monday)
  export function getClosedCompetitionWeek(now = new Date()) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
  
    // JS day: Sun=0 Mon=1 Tue=2 Wed=3 Thu=4 Fri=5 Sat=6
    const day = d.getDay()
  
    // most recent Tuesday at 00:00
    const daysSinceTuesday = (day - 2 + 7) % 7
    const currentTuesday = new Date(d)
    currentTuesday.setDate(d.getDate() - daysSinceTuesday)
  
    // the just-closed week starts 7 days before currentTuesday
    const closedWeekStart = new Date(currentTuesday)
    closedWeekStart.setDate(currentTuesday.getDate() - 7)
  
    const closedWeekEnd = new Date(currentTuesday)
    closedWeekEnd.setDate(currentTuesday.getDate() - 1) // Monday
  
    return {
      weekStart: toYMD(closedWeekStart),
      weekEnd: toYMD(closedWeekEnd),
      resetAt: currentTuesday.toISOString(),
    }
  }
  
  export function getWeekEndFromWeekStart(weekStart) {
    const d = new Date(`${weekStart}T00:00:00.000Z`)
    d.setUTCDate(d.getUTCDate() + 6)
    return d.toISOString().slice(0, 10)
  }