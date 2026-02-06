import { Job } from '../types';
import { v4 as uuidv4 } from 'uuid';

const companies = [
  'Google', 'Meta', 'Amazon', 'Apple', 'Microsoft',
  'Netflix', 'Stripe', 'Airbnb', 'Uber', 'Tesla',
  'Shopify', 'Salesforce', 'Adobe', 'Twitter', 'LinkedIn'
];

const locations = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA',
  'Austin, TX', 'Boston, MA', 'Remote', 'London, UK',
  'Toronto, Canada', 'Berlin, Germany', 'Singapore'
];

const jobTitles = [
  'Senior Frontend Engineer',
  'Full Stack Developer',
  'Backend Engineer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'UX Designer',
  'iOS Developer',
  'Android Developer',
  'Security Engineer',
  'Site Reliability Engineer',
  'Engineering Manager',
  'Technical Lead',
  'Solutions Architect'
];

const skillSets = [
  ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
  ['Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker'],
  ['JavaScript', 'Vue.js', 'MongoDB', 'Express', 'REST APIs'],
  ['Java', 'Spring Boot', 'Kubernetes', 'Microservices', 'Redis'],
  ['Python', 'TensorFlow', 'PyTorch', 'Pandas', 'Scikit-learn'],
  ['Go', 'Rust', 'System Design', 'Distributed Systems', 'Kafka'],
  ['Swift', 'iOS', 'UIKit', 'SwiftUI', 'Core Data'],
  ['Kotlin', 'Android', 'Jetpack Compose', 'MVVM', 'Retrofit'],
  ['React Native', 'Flutter', 'Mobile Development', 'Firebase'],
  ['DevOps', 'CI/CD', 'Terraform', 'Jenkins', 'Ansible']
];

const jobTypes: Job['jobType'][] = ['full-time', 'part-time', 'contract', 'internship'];
const workModes: Job['workMode'][] = ['remote', 'hybrid', 'onsite'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

export function generateMockJobs(count: number = 50): Job[] {
  const jobs: Job[] = [];

  for (let i = 0; i < count; i++) {
    const title = getRandomElement(jobTitles);
    const skills = getRandomElement(skillSets);
    const company = getRandomElement(companies);
    const location = getRandomElement(locations);
    
    jobs.push({
      id: uuidv4(),
      title,
      company,
      location,
      description: `We are looking for a talented ${title} to join our ${company} team. You will work on cutting-edge projects that impact millions of users worldwide. This role requires strong technical skills and the ability to collaborate with cross-functional teams.`,
      requirements: [
        `5+ years of experience in software development`,
        `Strong proficiency in ${skills[0]} and ${skills[1]}`,
        `Experience with ${skills[2]} and ${skills[3]}`,
        `Bachelor's degree in Computer Science or related field`,
        `Excellent problem-solving and communication skills`
      ],
      skills,
      jobType: getRandomElement(jobTypes),
      workMode: getRandomElement(workModes),
      postedDate: getRandomDate(60), // Last 60 days
      applyUrl: `https://careers.${company.toLowerCase().replace(/\s/g, '')}.com/jobs/${uuidv4()}`,
      salary: Math.random() > 0.3 ? `$${Math.floor(Math.random() * 100 + 100)}k - $${Math.floor(Math.random() * 100 + 150)}k` : undefined
    });
  }

  return jobs;
}
