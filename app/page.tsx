import { redirect } from 'next/navigation'

// Serve the v2 site as the main homepage
export default function RootPage() {
  redirect('/v2.html')
}
