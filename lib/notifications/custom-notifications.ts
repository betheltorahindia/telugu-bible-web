export type CustomNotification = {
  id: string
  enabled: boolean
  title: string
  body: string
  url: string
  sendAt: string
}

export const CUSTOM_NOTIFICATIONS: CustomNotification[] = [
  {
    id: 'rosh-chodesh-live-example',
    enabled: false,
    title: 'Rosh Chodesh is approaching',
    body: 'Get ready to join our upcoming Rosh Chodesh live. Tap to see the calendar.',
    url: '/calendar',
    sendAt: '2027-01-01T18:00:00+05:30',
  },
  {
    id: 'community-study-example',
    enabled: false,
    title: 'A new community gathering is coming',
    body: 'Set aside a little time for learning and fellowship. Open the community page for details.',
    url: '/social',
    sendAt: '2027-01-15T10:00:00+05:30',
  },
]
