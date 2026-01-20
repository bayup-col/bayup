// frontend/components/PageRenderer.tsx
"use client";

import React from 'react';

// Define types for your JSON sections
interface HeaderSection {
  type: 'header';
  settings: {
    title: string;
    logoUrl?: string;
  };
}

interface TextSection {
  type: 'text';
  settings: {
    content: string;
    textSize?: 'sm' | 'md' | 'lg';
    textColor?: string;
  };
}

interface HeroSection {
  type: 'hero';
  settings: {
    title: string;
    subtitle: string;
    imageUrl?: string;
    buttonText?: string;
    buttonLink?: string;
  };
}

// Union type for all possible sections
type Section = HeaderSection | TextSection | HeroSection;

interface PageContent {
  sections: Section[];
}

// Component mapping
const componentMap: Record<string, React.ComponentType<any>> = {
  header: ({ title, logoUrl }) => (
    <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
      {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 w-8 mr-2" />}
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  ),
  text: ({ content, textSize = 'md', textColor = 'text-gray-800' }) => {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };
    return <p className={`p-4 ${sizeClasses[textSize]} ${textColor}`}>{content}</p>;
  },
  hero: ({ title, subtitle, imageUrl, buttonText, buttonLink }) => (
    <div className="relative bg-gray-900 text-white py-20 px-4 text-center">
      {imageUrl && <img src={imageUrl} alt="Hero Background" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
      <div className="relative z-10">
        <h1 className="text-5xl font-bold mb-4">{title}</h1>
        <p className="text-xl mb-8">{subtitle}</p>
        {buttonText && buttonLink && (
          <Link href={buttonLink} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg">
            {buttonText}
          </Link>
        )}
      </div>
    </div>
  ),
  // Add more components here as needed
};

interface PageRendererProps {
  content: PageContent;
}

export default function PageRenderer({ content }: PageRendererProps) {
  if (!content || !content.sections || !Array.isArray(content.sections)) {
    return <div className="text-red-500 p-4">Invalid page content structure.</div>;
  }

  return (
    <>
      {content.sections.map((section, index) => {
        const Component = componentMap[section.type];
        if (Component) {
          return <Component key={index} {...section.settings} />;
        }
        return <div key={index} className="text-red-500 p-4">Unknown section type: {section.type}</div>;
      })}
    </>
  );
}
