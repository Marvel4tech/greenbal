import React from 'react'

const matches = [
  {
    id: 1,
    home: "Arsenal",
    away: "Man City",
    headToHead: [
      { date: "2025-09-10", home: "Arsenal", away: "Man City", result: "2 - 1" },
      { date: "2025-04-22", home: "Man City", away: "Arsenal", result: "3 - 0" },
      { date: "2024-12-15", home: "Arsenal", away: "Man City", result: "1 - 1" },
      { date: "2024-08-03", home: "Man City", away: "Arsenal", result: "0 - 2" },
      { date: "2024-05-10", home: "Arsenal", away: "Man City", result: "2 - 3" },
      { date: "2023-12-01", home: "Man City", away: "Arsenal", result: "1 - 0" },
    ],
  },
  {
    id: 2,
    home: "Liverpool",
    away: "Chelsea",
    headToHead: [
      { date: "2025-08-20", home: "Liverpool", away: "Chelsea", result: "1 - 1" },
      { date: "2025-02-11", home: "Chelsea", away: "Liverpool", result: "0 - 3" },
      { date: "2024-10-15", home: "Liverpool", away: "Chelsea", result: "2 - 2" },
      { date: "2024-04-09", home: "Chelsea", away: "Liverpool", result: "1 - 2" },
      { date: "2023-11-25", home: "Liverpool", away: "Chelsea", result: "3 - 0" },
      { date: "2023-05-18", home: "Chelsea", away: "Liverpool", result: "2 - 1" },
    ],
  },
  {
    id: 3,
    home: "Real Madrid",
    away: "Barcelona",
    headToHead: [
      { date: "2025-07-18", home: "Real Madrid", away: "Barcelona", result: "3 - 2" },
      { date: "2025-02-22", home: "Barcelona", away: "Real Madrid", result: "1 - 1" },
      { date: "2024-10-06", home: "Real Madrid", away: "Barcelona", result: "1 - 0" },
      { date: "2024-04-19", home: "Barcelona", away: "Real Madrid", result: "2 - 1" },
      { date: "2023-12-08", home: "Real Madrid", away: "Barcelona", result: "4 - 1" },
      { date: "2023-05-03", home: "Barcelona", away: "Real Madrid", result: "0 - 3" },
    ],
  },
]

const page = () => {

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-100 dark:bg-gray-900 px-4 py-6 md:px-10 md:py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-center mb-6">Game Assistance</h1>
        {matches.map((match) => (
          <section key={match.id} className="bg-white dark:bg-black/70 border rounded-lg shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
              <h2 className="text-lg md:text-xl font-semibold">
                {match.home} vs {match.away}
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                Head-to-Head (Last 6 Matches)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm border">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Home</th>
                    <th className="p-2 text-left">Away</th>
                    <th className="p-2 text-left">Result</th>
                  </tr>
                </thead>

                <tbody>
                  {match.headToHead.map((game, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-2">{game.date}</td>
                      <td className="p-2">{game.home}</td>
                      <td className="p-2">{game.away}</td>
                      <td className="p-2">{game.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-3 italic">
              {match.home}: {Math.floor(Math.random() * 3) + 1} Wins |{" "}
              {match.away}: {Math.floor(Math.random() * 3) + 1} Wins | Draws:{" "}
              {Math.floor(Math.random() * 3)}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}

export default page