export interface CustomHtmlTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  folderPath: string;
  category: 'Landing' | 'Tienda' | 'Corporativo' | 'Venta Directa';
}

export const CUSTOM_HTML_TEMPLATES: CustomHtmlTemplate[] = [
  {
    id: 'tpl-comp',
    name: 'Tech Computer Pro',
    description: 'Especializada en hardware y equipos de computación de alto rendimiento.',
    thumbnail: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=800',
    folderPath: 'computadora',
    category: 'Tienda'
  },
  {
    id: 'tpl-hogar',
    name: 'Home & Comfort',
    description: 'Diseño cálido y minimalista para artículos del hogar y decoración.',
    thumbnail: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=800',
    folderPath: 'Hogar',
    category: 'Tienda'
  },
  {
    id: 'tpl-joyeria',
    name: 'Jewelry Luxe',
    description: 'Elegancia y brillo para catálogos de joyas y accesorios premium.',
    thumbnail: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800',
    folderPath: 'Joyeria',
    category: 'Tienda'
  },
  {
    id: 'tpl-jugueteria',
    name: 'Kids World Fun',
    description: 'Colorida y dinámica, ideal para juguetes y mundo infantil.',
    thumbnail: 'https://images.unsplash.com/photo-1532330393533-443990a51d10?q=80&w=800',
    folderPath: 'Jugueteria',
    category: 'Tienda'
  },
  {
    id: 'tpl-lenceria',
    name: 'Intimate Elegance',
    description: 'Estilo sofisticado y delicado para marcas de lencería y moda íntima.',
    thumbnail: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?q=80&w=800',
    folderPath: 'lenceria',
    category: 'Tienda'
  },
  {
    id: 'tpl-maquillaje',
    name: 'Beauty & Glow',
    description: 'Enfoque visual en cosméticos, maquillaje y cuidado personal.',
    thumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800',
    folderPath: 'Maquillaje',
    category: 'Tienda'
  },
  {
    id: 'tpl-papeleria',
    name: 'Stationery Master',
    description: 'Orden y creatividad para útiles escolares y de oficina.',
    thumbnail: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=800',
    folderPath: 'Papeleria',
    category: 'Tienda'
  },
  {
    id: 'tpl-pocket',
    name: 'Pocket Store Quick',
    description: 'Diseño compacto y ultra-rápido para ventas directas desde móvil.',
    thumbnail: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=800',
    folderPath: 'pocket',
    category: 'Venta Directa'
  },
  {
    id: 'tpl-ropa-elegante',
    name: 'Classic Couture',
    description: 'Alta costura y moda formal con acabados de lujo.',
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800',
    folderPath: 'Ropa elegante',
    category: 'Tienda'
  },
  {
    id: 'tpl-tecno',
    name: 'Tech Engine Hub',
    description: 'Lo último en gadgets y tecnología con estética futurista.',
    thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800',
    folderPath: 'Tecnologia',
    category: 'Tienda'
  },
  {
    id: 'tpl-tenis',
    name: 'Urban Sneakers',
    description: 'Cultura urbana y deportiva enfocada en calzado de tendencia.',
    thumbnail: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800',
    folderPath: 'Tenis',
    category: 'Tienda'
  },
  {
    id: 'tpl-zapatos',
    name: 'Footwear Collection',
    description: 'Catálogo versátil para todo tipo de calzado y estilos.',
    thumbnail: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800',
    folderPath: 'Zapatos',
    category: 'Tienda'
  }
];
