import React from 'react';
import { BookOpen, Award, MapPin, Mail, ExternalLink } from 'lucide-react';

const ResearcherCard = ({ researcher }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-slate-900">{researcher.name}</h3>
        <p className="text-sm text-slate-600">{researcher.title}</p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4" />
          <span>{researcher.institution}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4" />
          <span>{researcher.location}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-slate-700 mb-2">Research Areas</p>
        <div className="flex flex-wrap gap-2">
          {researcher.expertises.map((exp, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
            >
              {exp}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">{researcher.publications} pubs</span>
        </div>
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">h-index: {researcher.hIndex}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`mailto:${researcher.email}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Mail className="w-4 h-4" />
          Contact
        </a>
        <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
// Example Useage
const App = () => {
  const sampleResearcher = {
    id: 1,
    name: 'Dr. Sarah Chen',
    title: 'Professor of Machine Learning',
    institution: 'MIT',
    location: 'Cambridge, MA',
    expertises: ['Machine Learning', 'Neural Networks', 'Computer Vision'],
    publications: 147,
    hIndex: 42,
    email: 's.chen@mit.edu'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-sm">
        <ResearcherCard researcher={sampleResearcher} />
      </div>
    </div>
  );
};

export default App;