import React from 'react'

const page = () => {
    const leaderBoardData = [
      { id: 1, name: 'Marvellous Ighosotu', points: 1450, duration: '00:12:34' },
      { id: 2, name: 'Jane Smith', points: 1340, duration: '00:11:34' },
      { id: 3, name: 'Brown Mountain', points: 1250, duration: '00:10:34' },
      { id: 4, name: 'Femi Ayobami', points: 1150, duration: '00:09:34' },
      { id: 5, name: 'Eazi Ajibade', points: 1050, duration: '00:08:34' },
      { id: 6, name: 'Vision Gooder', points: 950, duration: '00:07:34' },
      { id: 7, name: 'Marvellous Ighosotu', points: 1450, duration: '00:12:34' },
      { id: 8, name: 'Jane Smith', points: 1340, duration: '00:11:34' },
      { id: 9, name: 'Brown Mountain', points: 1250, duration: '00:10:34' },
      { id: 10, name: 'Femi Ayobami', points: 1150, duration: '00:09:34' },
      { id: 11, name: 'Eazi Ajibade', points: 1050, duration: '00:08:34' },
      { id: 12, name: 'Vision Gooder', points: 950, duration: '00:07:34' },
      { id: 13, name: 'Jane Smith', points: 1340, duration: '00:11:34' },
      { id: 14, name: 'Brown Mountain', points: 1250, duration: '00:10:34' },
      { id: 15, name: 'Femi Ayobami', points: 1150, duration: '00:09:34' },
      { id: 16, name: 'Eazi Ajibade', points: 1050, duration: '00:08:34' },
      { id: 17, name: 'Vision Gooder', points: 950, duration: '00:07:34' },
    ];

  return (
    <div className=' w-full h-auto min-h-[calc(100vh - 5rem)] flex flex-col items-center py-8 px-4 bg-gray-50 dark:bg-gray-900'>
        <div className=' w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden'>
          {/* Header */}
          <div className=' px-6 py-4 border-b border-gray-200 dark:border-gray-700'>
            <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-100 text-center'>
              Weekly Leaderboard
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400 text-center mt-1'>
              Top performers based on total points and fastest completion time.
            </p>
          </div>

          {/* Table */}
          <div className=' overflow-x-auto'>
            <table className=' min-w-full table-auto text-sm'>
              <thead className=' bg-gray-100 dark:bg-gray-700'>
                <tr>
                  <th className=' px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200'>Rank</th>
                  <th className=' px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200'>Name</th>
                  <th className=' px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200'>Points</th>
                  <th className=' px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200'>Duration</th>
                </tr>
              </thead>
              <tbody>
                {leaderBoardData.map((player, index) => (
                  <tr
                    key={player.id}
                    className={` border-b border-gray-100 dark:border-gray-700 ${
                      index === 0
                        ? 'bg-yellow-100 dark:bg-yellow-900/40 font-semibold'
                        : index === 1
                        ? 'bg-gray-100 dark:bg-gray-800/70'
                        : ''
                    }`}
                  >
                    <td className='px-6 py-3 text-gray-700 dark:text-gray-200'>
                      #{index + 1}
                    </td>
                    <td className='px-6 py-3 text-gray-700 dark:text-gray-200'>
                      {player.name}
                    </td>
                    <td className='px-6 py-3 text-gray-700 dark:text-gray-200'>
                      {player.points}
                    </td>
                    <td className='px-6 py-3 text-gray-700 dark:text-gray-200'>
                      {player.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}

export default page