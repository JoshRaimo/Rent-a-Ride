import React, { useState } from 'react';
import axios from 'axios';

const ImageUpload = () => {
    const [file, setFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/images/upload`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setImageUrl(response.data.imageUrl);
            setFile(null); // Reset the file input after successful upload
        } catch (error) {
            console.error('Error uploading image:', error);
            const errorMessage =
                error.response?.data?.error || 'Failed to upload image. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-6 text-center">Upload Image to S3</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {imageUrl && (
                <div className="mb-4">
                    <p className="text-green-500">Image uploaded successfully!</p>
                    <img
                        src={imageUrl}
                        alt="Uploaded"
                        className="w-full h-auto mt-4 border"
                    />
                    <p className="text-sm mt-2 text-gray-500">
                        <strong>URL:</strong> <a href={imageUrl} target="_blank" rel="noopener noreferrer">{imageUrl}</a>
                    </p>
                </div>
            )}
            <div className="mb-4">
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 border border-gray-300 rounded cursor-pointer"
                    accept="image/*" // Restrict file input to images only
                />
            </div>
            <button
                onClick={handleUpload}
                disabled={loading}
                className={`w-full py-2 text-white rounded ${
                    loading
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                }`}
            >
                {loading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
    );
};

export default ImageUpload;