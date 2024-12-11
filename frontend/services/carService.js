import axios from 'axios';

export const fetchCars = async () => {
  const response = await axios.get(`${process.env.REACT_APP_API_URL}/cars`);
  return response.data;
};