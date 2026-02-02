"use client";

import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export type ComponentType = 'text' | 'image' | 'button' | 'section' | 'grid' | 'catalog' | 'whatsapp' | 'countdown';

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
}

export const PageRenderer: React.FC<PageRendererProps> = ({ 
    components, 
    onComponentClick, 
    onComponentDrag,
    selectedId,
    isEditor = false,
    constraintsRef
}) => {
    
    const renderComponent = (comp: PageComponent) => {
        const isSelected = selectedId === comp.id;
        
        const freeStyle: React.CSSProperties = isEditor && comp.position ? {
            position: 'absolute',
            left: `${comp.position.x}px`,
            top: `${comp.position.y}px`,
            zIndex: isSelected ? 100 : 10,
            ...comp.styles
        } : comp.styles;

        const editorClasses = isEditor ? `
            cursor-grab active:cursor-grabbing transition-shadow
            ${isSelected ? 'ring-2 ring-[#00f2ff] ring-offset-4 ring-offset-white shadow-2xl scale-[1.01]' : 'hover:ring-1 hover:ring-gray-300'}
        ` : '';

        const handleClick = (e: React.MouseEvent) => {
            if (isEditor && onComponentClick) {
                e.stopPropagation();
                onComponentClick(comp.id);
            }
        };

        const commonProps = isEditor ? {
            drag: true,
            dragMomentum: false,
            dragConstraints: constraintsRef, // BLOQUEO DE BORDES
            onDragEnd: (e: any, info: any) => {
                if (onComponentDrag && comp.position) {
                    onComponentDrag(comp.id, comp.position.x + info.offset.x, comp.position.y + info.offset.y);
                }
            }
        } : {};

        switch (comp.type) {
            case 'text':
                return (
                    <motion.div {...commonProps} key={comp.id} onClick={handleClick} className={editorClasses} style={freeStyle}>
                        {comp.props.text || 'Escribe aquí...'}
                    </motion.div>
                );

            case 'button':
                return (
                    <motion.button {...commonProps} key={comp.id} onClick={handleClick} className={`${editorClasses} font-black uppercase tracking-widest`} style={freeStyle}>
                        {comp.props.label || 'Botón'}
                    </motion.button>
                );

            case 'image':
                return (
                    <motion.div {...commonProps} key={comp.id} onClick={handleClick} className={editorClasses} style={freeStyle}>
                        <img 
                            src={comp.props.src || 'https://via.placeholder.com/400x300'} 
                            alt="Visual"
                            className="w-full h-full object-cover rounded-[inherit] pointer-events-none"
                        />
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="relative w-full h-full min-h-[800px]">
            {components.map(renderComponent)}
        </div>
    );
};