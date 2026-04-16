import { redirect } from 'next/navigation'

// Serve the existing static homepage
export default function RootPage() {
  redirect('/index.html')
}
