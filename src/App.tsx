import React from 'react'
import VideoAssistant from './widgets/VideoAssistant/VideoAssistant'
import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom'
import IndexTaskSection from './widgets/IndexVideos'

const router = createBrowserRouter([
  {
    path: '/',
    element: <VideoAssistant/>
  },
  {
    path: '/Chat',
    element: <VideoAssistant/>
  },
  {
    path: '/Index',
    element: <IndexTaskSection indexId='1' />
  }
])

const App = (): JSX.Element => (
  <RouterProvider router={router} />
)

export default App
