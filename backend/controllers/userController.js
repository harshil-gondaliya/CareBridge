export const getUserProfile = async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      specialization: req.user.specialization,
      experience: req.user.experience,
      licenseNumber: req.user.licenseNumber,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  })
}
