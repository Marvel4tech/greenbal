function toYMD(date) {
  return date.toISOString().slice(0, 10)
}

// Tuesday-start week
export function getClosedCompetitionWeek(now = new Date()) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)

  // Sunday=0 Monday=1 Tuesday=2
  const day = d.getDay()

  const daysSinceTuesday = (day - 2 + 7) % 7
  const currentTuesday = new Date(d)
  currentTuesday.setDate(d.getDate() - daysSinceTuesday)

  const closedWeekStart = new Date(currentTuesday)
  closedWeekStart.setDate(currentTuesday.getDate() - 7)

  const closedWeekEnd = new Date(currentTuesday)
  closedWeekEnd.setDate(currentTuesday.getDate() - 1)

  return {
    weekStart: toYMD(closedWeekStart),
    weekEnd: toYMD(closedWeekEnd),
    resetAt: currentTuesday.toISOString(),
  }
}