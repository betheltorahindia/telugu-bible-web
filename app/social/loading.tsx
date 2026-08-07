import { GlobeLoader } from '../../components/social/GlobeLoader'
import './social.css'

export default function Loading() {
  return (
    <div className="social-world grid min-h-screen place-items-center">
      <GlobeLoader label="Entering the world" />
    </div>
  )
}