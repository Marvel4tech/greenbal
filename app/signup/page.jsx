import { Suspense } from 'react'
import RegisterClient from './RegisterClient'

export const metadata = {
  title: 'Sign Up',
  description:
    'Create your Greenball360 account and join our free football prediction platform.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen" />}>
      <RegisterClient />
    </Suspense>
  )
}