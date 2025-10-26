'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@nextui-org/button';
import { Avatar } from '@nextui-org/avatar';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@nextui-org/react';
import { useTranslations } from 'next-intl';

export default function AuthButton() {
  const { data: session } = useSession();
  const t = useTranslations('user');
  if (session) {
    return (
      <Dropdown>
        <DropdownTrigger>
          <Avatar
            src={session.user?.image || ''}
            alt={session.user?.name || ''}
          />
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem key='name' isReadOnly>
            {session.user?.name}
          </DropdownItem>
          <DropdownItem key='email' isReadOnly>
            {session.user?.email}
          </DropdownItem>
          <DropdownItem key='profile' href='/profile'>
            {t('profile')}
          </DropdownItem>
          <DropdownItem key='signout' onClick={() => signOut()}>
            {t('logout')}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }
  return <Button onClick={() => signIn('google')}>{t('login')}</Button>;
}
