import React from 'react'
import VideoAssistant from './widgets/VideoAssistant/VideoAssistant'
import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom'
import IndexVideos from './widgets/IndexVideos/IndexVideos'

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
    element: <IndexVideos/>
  }
])

const App = (): JSX.Element => (
  <RouterProvider router={router} />
)

export default App
