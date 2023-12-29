import axios from "axios";

export const nextAPI = axios.create({
	baseURL: '/api'
})

