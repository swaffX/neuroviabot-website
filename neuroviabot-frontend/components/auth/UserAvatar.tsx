'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  UserIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { getDiscordAvatarUrl } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import Image from 'next/image';

export default function UserAvatar() {
  const { user, logout } = useUser();
  
  if (!user) return null;
  const avatarUrl = getDiscordAvatarUrl(user.id, user.avatar);
  
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800 transition">
        <Image
          src={avatarUrl}
          alt={user.username || 'User'}
          width={32}
          height={32}
          className="rounded-full"
        />
        <div className="hidden md:block text-left">
          <p className="text-white text-sm font-medium">{user.username}</p>
          <p className="text-gray-400 text-xs">#{user.discriminator}</p>
        </div>
      </Menu.Button>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-gray-800 border border-gray-700 shadow-lg focus:outline-none z-10">
          <div className="p-3 border-b border-gray-700">
            <p className="text-white font-medium">{user.username}</p>
            <p className="text-gray-400 text-sm">#{user.discriminator}</p>
          </div>
          
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-700' : ''
                  } group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white transition`}
                >
                  <UserIcon className="w-5 h-5" />
                  Profile
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-700' : ''
                  } group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white transition`}
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                  Settings
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-700' : ''
                  } group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-yellow-400 transition`}
                >
                  <SparklesIcon className="w-5 h-5" />
                  Premium
                </button>
              )}
            </Menu.Item>
          </div>
          
          <div className="p-1 border-t border-gray-700">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={`${
                    active ? 'bg-red-950/50' : ''
                  } group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 transition`}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Sign Out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
