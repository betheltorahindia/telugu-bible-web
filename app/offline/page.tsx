import Image from 'next/image'

export default function OfflinePage() {
  return (
    <div className="offline-page space-y-3 p-4">
      <Image src="/ezra.svg" alt="Ezra the robot" width={112} height={112} className="offline-page-mascot" />
      <div>
        <h1 className="text-xl font-semibold">ఆఫ్లైన్‌లో ఉన్నారు</h1>
        <p className="opacity-75">
          మీరు ఆఫ్లైన్‌లో ఉన్నారు. ఇప్పటికే సందర్శించిన పేజీలు, అధ్యాయాలు, చిత్రాలు ఇంకా పనిచేస్తాయి.
          కొత్త పేజీలకు కలవాలంటే ఇంటర్నెట్ అవసరం.
        </p>
        <p className="mt-2 font-medium">Hi, I’m Ezra. I can still help you find your way around the app.</p>
      </div>
    </div>
  );
}
