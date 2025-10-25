'use client';

import * as React from 'react';
import { NextUIProvider } from '@nextui-org/system';
import { useRouter } from '../navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { useLocale } from 'next-intl';

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  messages?: any;
}

export function Providers({
  children,
  themeProps,
  messages
}: ProvidersProps) {
  const router = useRouter();
  const locale = useLocale();

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider>{children}</SessionProvider>
        </NextIntlClientProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
