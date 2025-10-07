import Image from 'next/image'
import React from 'react'
import { Button } from './ui/button'
import { Edit2Icon } from 'lucide-react'

const ProfileUserCard = () => {
  return (
    <div className=' flex flex-col h-auto min-h-full p-6'>
        {/* Image Section */}
        <div className=' w-full h-48 lg:h-56 rounded-sm relative overflow-hidden'>
            <Image 
                src={'/images/greenbul1.jpg'}
                fill
                alt='userProfile'
                className=' object-cover rounded-t-sm'
            />
        </div>

        {/* Info Section */}
        <div className=' flex flex-col w-full mt-5 flex-grow'>
            <div className=' flex flex-row justify-between flex-wrap'>
                <div>
                    <h2 className=' font-semibold'>My profile</h2>
                </div>
                <div className=' flex flex-col space-y-2'>
                    <div className=' flex flex-col'>
                        <h4 className=' text-sm font-medium'>Full Name:</h4>
                        <h4 className=' text-xs'>Marvellous Ayomike</h4>
                    </div>
                    <div className=' flex flex-col'>
                        <h4 className=' text-sm font-medium'>Bank Name:</h4>
                        <h4 className=' text-xs'>Access Bank</h4>
                    </div>
                    <div className=' flex flex-col'>
                        <h4 className=' text-sm font-medium'>Bank Account:</h4>
                        <h4 className=' text-xs'>0832457654</h4>
                    </div>
                </div>
            </div>
            <div className=' flex flex-1 flex-col mt-5'>
                <div className=' flex flex-row justify-between border-b pb-2'>
                    <h4 className=' text-sm'>Nigeria</h4>
                    <h4 className=' font-medium text-sm'>+234 706 67467 857</h4>
                </div>
                <div className=' border-b pb-2 pt-4'>
                    <h4 className=' text-sm'>marvel4techkdk@gmail.com</h4>
                </div>
                <div className=' flex flex-row justify-between border-b pb-2 pt-5'>
                    <h4 className=' text-sm'>Gender:</h4>
                    <h4 className=' font-medium text-sm'>Male</h4>
                </div>
            </div>
            <div className=' mt-5 self-center'>
                <Button>
                    <Edit2Icon />
                    Edit Profile
                </Button>
            </div>
        </div>
    </div>
  )
}

export default ProfileUserCard