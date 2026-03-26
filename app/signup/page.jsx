import { Suspense } from 'react'
import RegisterClient from './RegisterClient'

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen" />}>
      <RegisterClient />
    </Suspense>
  )
}