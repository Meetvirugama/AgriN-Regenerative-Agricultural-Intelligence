import { Router } from "express";

const router = Router();

// Endpoint to get experts list
router.get("/", async (req, res) => {
  try {
    const mockExperts = [
      {
        id: "exp-1",
        name: "Dr. Amit Verma",
        title: "Plant Pathologist",
        rating: 4.8,
        reviews: 320,
        status: "Online",
        imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80"
      },
      {
        id: "exp-2",
        name: "Dr. Neha Sharma",
        title: "Soil Scientist",
        rating: 4.7,
        reviews: 245,
        status: "Offline",
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80"
      },
      {
        id: "exp-3",
        name: "Dr. Rajesh Kumar",
        title: "Agronomist",
        rating: 4.6,
        reviews: 198,
        status: "Offline",
        imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80"
      },
      {
        id: "exp-4",
        name: "Dr. Priya Singh",
        title: "Entomologist",
        rating: 4.7,
        reviews: 186,
        status: "Offline",
        imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80"
      },
      {
        id: "exp-5",
        name: "Dr. Sandeep Yadav",
        title: "Irrigation Specialist",
        rating: 4.6,
        reviews: 142,
        status: "Offline",
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
      }
    ];

    res.json(mockExperts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
