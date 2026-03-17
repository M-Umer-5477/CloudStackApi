const redisClient = require('../utils/redisClient');
const Project = require('../models/project');
const  logger = require('../utils/logger');
// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description,
      owner: req.user._id
    });
    await redisClient.del(`projects:${req.user._id}`);
    logger.info(`Project created: ${project._id} by user ${req.user._id}`);
    res.status(201).json(project);
  } catch (err) {
    logger.error(`Error creating project: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// Get all projects for the logged-in user
exports.getProjects = async (req, res) => {

  const cacheKey = `projects:${req.user._id}`;

  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    console.log("Serving from cache");
    return res.json(JSON.parse(cachedData));
  }

  const projects = await Project.find({ owner: req.user._id });

  await redisClient.set(cacheKey, JSON.stringify(projects), {
    EX: 60
  });
logger.info(`Projects retrieved for user ${req.user._id}, count: ${projects.length}`);
  res.json(projects);
};

// Get single project
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
   
    if(!project) {
      logger.warn(`Project not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    logger.info(`Project retrieved: ${project._id} for user ${req.user._id}`);  
    res.json(project);
  } catch (err) {
    logger.error(`Error retrieving project: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name, description, updatedAt: Date.now() },
      { new: true }
    );
    if(!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if(!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};