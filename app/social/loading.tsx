import { GlobeLoader } from '../../components/social/GlobeLoader'
import './social.css'

export default function Loading() {
  return (
    <div className="social-loading-screen">
      <GlobeLoader label="Entering the world" />
    </div>
  )
}