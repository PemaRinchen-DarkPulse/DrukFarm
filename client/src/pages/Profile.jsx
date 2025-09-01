import React, { useState } from "react";

const Profile = () => {
  const [formData, setFormData] = useState({
    fullName: "Pema Dorji",
    farmName: "Green Valley Farm",
    farmLocation: "Thimphu, Bhutan",
    farmDescription:
      "Organic farming practices with traditional Bhutanese methods. Specializing in high-altitude crops and heritage varieties.",
    phone: "+975 1234 5678",
    email: "pema@example.bt",
    profilePic: null,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData({ ...formData, profilePic: imageUrl });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Updated Profile:", formData);
    alert("Profile updated successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto bg-card text-card-foreground shadow rounded-lg p-6 mt-10">
      <h2 className="text-2xl font-semibold mb-1">Farmer Profile</h2>
      <p className="text-muted-foreground mb-6">
        Manage your farm and personal information
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Picture + Full Name, Farm Name, Farm Location beside it */}
        <div className="flex items-start gap-6 mb-6">
          {/* Profile Image */}
          <div className="flex flex-col items-start">
            <img
              src={
                formData.profilePic ||
                "https://via.placeholder.com/150?text=Photo"
              }
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover mb-3 border"
            />
            <label className="cursor-pointer text-primary-foreground bg-primary px-3 py-1 rounded-md text-sm">
              Upload Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Inputs beside picture */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border rounded-md p-2 focus:ring"
                style={{ outlineColor: 'var(--ring)' }}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Farm Name</label>
              <input
                type="text"
                name="farmName"
                value={formData.farmName}
                onChange={handleChange}
                className="w-full border rounded-md p-2 focus:ring"
                style={{ outlineColor: 'var(--ring)' }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">Farm Location</label>
              <input
                type="text"
                name="farmLocation"
                value={formData.farmLocation}
                onChange={handleChange}
                className="w-full border rounded-md p-2 focus:ring"
                style={{ outlineColor: 'var(--ring)' }}
              />
            </div>
          </div>
        </div>

        {/* Farm Description */}
        <div>
          <label className="block font-medium mb-1">Farm Description</label>
          <textarea
            name="farmDescription"
            value={formData.farmDescription}
            onChange={handleChange}
            className="w-full border rounded-md p-2 h-24 focus:ring"
            style={{ outlineColor: 'var(--ring)' }}
          />
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:ring"
              style={{ outlineColor: 'var(--ring)' }}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-md p-2 focus:ring"
              style={{ outlineColor: 'var(--ring)' }}
            />
          </div>
        </div>

        {/* Update Button */}
        <div>
          <button
            type="submit"
            className="text-primary-foreground bg-primary px-4 py-2 rounded-md"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
