export const getDoctorDashboard = async (req, res) => {
  return res.status(200).json({
    message: 'Doctor dashboard data fetched successfully',
    dashboard: {
      doctorId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      specialization: req.user.specialization,
      experience: req.user.experience,
      isVerified: req.user.isVerified,
    },
  })
}
