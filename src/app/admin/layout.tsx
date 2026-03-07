import { ClerkProvider, Show, UserButton, SignUpButton, SignInButton, RedirectToSignIn } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
         <ClerkProvider>
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <Show when="signed-out">
              <RedirectToSignIn />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
  )
}