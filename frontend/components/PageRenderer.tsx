"use client";

import { motion } from 'framer-motion';
import { SmartNavbar, SmartHero, SmartProductGrid, SmartContactForm } from './dashboard/studio/HighFidelityBlocks';

export type ComponentType = 'text' | 'image' | 'button' | 'section' | 'grid' | 'catalog' | 'whatsapp' | 'countdown' | 'navbar' | 'hero-banner' | 'product-grid' | 'categories-grid' | 'footer-premium' | 'contact-form';

export interface PageComponent {
    id: string;
    type: ComponentType;
    props: any;
    styles: React.CSSProperties;
    position?: { x: number, y: number };
    children?: PageComponent[];
}

interface PageRendererProps {
    components: PageComponent[];
    onComponentClick?: (id: string) => void;
    onComponentDrag?: (id: string, x: number, y: number) => void;
    selectedId?: string | null;
    isEditor?: boolean;
    constraintsRef?: React.RefObject<HTMLDivElement>;
    tenantId?: string;
}

export const PageRenderer: React.FC<PageRendererProps> = ({ 
    components, 
    onComponentClick, 
    onComponentDrag,
    selectedId,
    isEditor = false,
    constraintsRef,
    tenantId
}) => {
    
    const renderComponent = (comp: PageComponent) => {
        const isSelected = selectedId === comp.id;
        
        const editorClasses = isEditor ? `
            cursor-pointer transition-all duration-300 relative
            ${isSelected ? 'ring-4 ring-[#00f2ff] ring-inset z-20 shadow-2xl' : 'hover:ring-2 hover:ring-gray-300'}
        ` : '';

        const handleClick = (e: React.MouseEvent) => {
            if (isEditor && onComponentClick) {
                e.stopPropagation();
                onComponentClick(comp.id);
            }
        };

        const renderContent = () => {
            switch (comp.type) {
                case 'navbar':
                    return <SmartNavbar props={comp.props} />;
                case 'hero-banner':
                    return <SmartHero props={comp.props} />;
                case 'product-grid':
                    return <SmartProductGrid props={comp.props} />;
                case 'contact-form':
                    return <SmartContactForm props={comp.props} tenantId={tenantId} />;
                case 'text':
                    return <div style={comp.styles}>{comp.props.text || 'Escribe aquí...'}</div>;
                case 'button':
                    return <button className="font-black uppercase tracking-widest" style={comp.styles}>{comp.props.label || 'Botón'}</button>;
                case 'image':
                    return <img src={comp.props.src} alt="Visual" className="w-full h-full object-cover" />;
                default:
                    return <div className="p-10 border border-dashed border-gray-200 text-center text-gray-400 text-xs">Bloque: {comp.type}</div>;
            }
        };

        return (
            <div 
                key={comp.id} 
                onClick={handleClick} 
                className={editorClasses}
                style={!isEditor && comp.position ? { position: 'absolute', left: comp.position.x, top: comp.position.y, ...comp.styles } : comp.styles}
            >
                {renderContent()}
                
                {/* Etiqueta flotante solo en editor */}
                {isEditor && isSelected && (
                    <div className="absolute top-0 left-0 bg-[#00f2ff] text-[#004d4d] text-[8px] font-black px-2 py-1 uppercase tracking-widest z-30">
                        {comp.type}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative w-full h-full min-h-screen font-display">
            {components.map(renderComponent)}
        </div>
    );
};
