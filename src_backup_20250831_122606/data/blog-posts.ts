import type { BlogPost, BlogCategory, BlogSearchResult, BlogFilters } from '../types/blog';

export const blogPosts: BlogPost[] = [
	{
		id: 'ciberseguridad-2024',
		title: 'Ciberseguridad en 2024: Tendencias y Desafíos',
		slug: 'ciberseguridad-2024',
		excerpt: 'Descubre las principales amenazas y soluciones en ciberseguridad para este año.',
		image: '/images/blog/cybersecurity.jpg',
		category: 'Ciberseguridad',
		categories: ['Ciberseguridad', 'Tecnología'],
		date: '15 Enero 2024',
		author: 'Juan Pérez',
		authorRole: 'Especialista en Ciberseguridad',
		authorImage: '/images/team/juan-perez.jpg',
		tags: ['ciberseguridad', 'seguridad', 'tecnología', '2024'],
		readTime: 5,
		content: `
			<h2>Introducción</h2>
			<p>En el panorama digital actual, la ciberseguridad se ha convertido en una prioridad absoluta para empresas de todos los tamaños. A medida que avanzamos en 2024, nuevas amenazas y desafíos emergen, requiriendo estrategias actualizadas y soluciones innovadoras.</p>

			<h2>Principales Tendencias en 2024</h2>
			<ul>
				<li>Aumento de ataques de ransomware dirigidos</li>
				<li>Amenazas basadas en Inteligencia Artificial</li>
				<li>Vulnerabilidades en IoT empresarial</li>
				<li>Phishing avanzado y ingeniería social</li>
			</ul>

			<h2>Soluciones y Mejores Prácticas</h2>
			<p>Para hacer frente a estas amenazas, las organizaciones deben implementar:</p>
			<ol>
				<li>Sistemas de detección y respuesta automatizados</li>
				<li>Programas de concientización para empleados</li>
				<li>Políticas de seguridad Zero Trust</li>
				<li>Copias de seguridad cifradas y distribuidas</li>
			</ol>

			<h2>El Papel de la IA en la Ciberseguridad</h2>
			<p>La Inteligencia Artificial está jugando un papel cada vez más importante en la detección y prevención de amenazas. Los sistemas basados en IA pueden:</p>
			<ul>
				<li>Identificar patrones de comportamiento sospechoso</li>
				<li>Automatizar respuestas a incidentes</li>
				<li>Predecir posibles vectores de ataque</li>
				<li>Mejorar la eficiencia del análisis de seguridad</li>
			</ul>

			<h2>Conclusiones</h2>
			<p>La ciberseguridad en 2024 requiere un enfoque proactivo y holístico. Las organizaciones deben mantenerse actualizadas sobre las últimas amenazas y adoptar soluciones innovadoras para proteger sus activos digitales.</p>
		`
	},
	{
		id: 'cloud-computing-recursos',
		title: 'Cloud Computing: Optimizando Recursos Empresariales',
		slug: 'cloud-computing-recursos',
		excerpt: 'Cómo la nube está transformando la gestión de recursos en las empresas modernas.',
		image: '/images/blog/cloud-computing.jpg',
		category: 'Cloud',
		categories: ['Cloud', 'Tecnología', 'Infraestructura'],
		date: '10 Enero 2024',
		author: 'María González',
		authorRole: 'Arquitecta de Soluciones Cloud',
			authorImage: '/images/team/maria-gonzalez.jpg',
		tags: ['cloud', 'empresas', 'recursos', 'tecnología'],
		readTime: 6,
		content: `
			<h2>Introducción</h2>
			<p>La computación en la nube ha revolucionado la forma en que las empresas gestionan sus recursos tecnológicos. En este artículo, exploraremos cómo el cloud computing está transformando la eficiencia operativa y reduciendo costos en las organizaciones modernas.</p>

			<h2>Beneficios Clave del Cloud Computing</h2>
			<ul>
				<li>Escalabilidad bajo demanda</li>
				<li>Reducción de costos operativos</li>
				<li>Mayor flexibilidad y agilidad</li>
				<li>Acceso global y colaboración mejorada</li>
			</ul>

			<h2>Modelos de Servicio en la Nube</h2>
			<h3>1. Infrastructure as a Service (IaaS)</h3>
			<p>Proporciona recursos de computación virtualizados a través de Internet. Ideal para empresas que necesitan control total sobre su infraestructura sin la necesidad de mantener hardware físico.</p>

			<h3>2. Platform as a Service (PaaS)</h3>
			<p>Ofrece una plataforma completa de desarrollo y despliegue de aplicaciones. Perfecto para equipos de desarrollo que quieren centrarse en la programación sin preocuparse por la infraestructura.</p>

			<h3>3. Software as a Service (SaaS)</h3>
			<p>Aplicaciones completas entregadas a través de Internet. La solución más común para aplicaciones empresariales como CRM, correo electrónico y herramientas de colaboración.</p>

			<h2>Optimización de Recursos en la Nube</h2>
			<ol>
				<li>Implementación de auto-escalado</li>
				<li>Uso de contenedores y orquestación</li>
				<li>Gestión eficiente de almacenamiento</li>
				<li>Monitoreo y optimización de costos</li>
			</ol>

			<h2>Conclusiones</h2>
			<p>El cloud computing continúa evolucionando y ofreciendo nuevas oportunidades para la optimización de recursos empresariales. Las organizaciones que adoptan estrategias cloud bien planificadas están mejor posicionadas para el éxito en la era digital.</p>
		`
	},
	{
		id: 'big-data-analisis',
		title: 'Big Data: Análisis Predictivo para Negocios',
		slug: 'big-data-analisis',
		excerpt: 'Implementación de análisis predictivo para mejorar la toma de decisiones.',
		image: '/images/blog/big-data.jpg',
		category: 'Análisis de Datos',
		categories: ['Análisis de Datos', 'Big Data', 'Tecnología'],
		date: '5 Enero 2024',
		author: 'Carlos Rodríguez',
		authorRole: 'Científico de Datos Senior',
		authorImage: '/images/team/carlos-rodriguez.jpg',
		tags: ['big data', 'análisis', 'predictivo', 'negocios'],
		readTime: 7,
		content: `
			<h2>Introducción al Análisis Predictivo</h2>
			<p>El análisis predictivo se ha convertido en una herramienta fundamental para las empresas que buscan anticiparse a las tendencias del mercado y tomar decisiones basadas en datos.</p>

			<h2>Componentes del Análisis Predictivo</h2>
			<ul>
				<li>Recolección y limpieza de datos</li>
				<li>Análisis estadístico avanzado</li>
				<li>Modelos de machine learning</li>
				<li>Visualización de datos</li>
			</ul>

			<h2>Aplicaciones Prácticas</h2>
			<p>El análisis predictivo puede aplicarse en diversos sectores:</p>
			<ol>
				<li>Predicción de ventas</li>
				<li>Análisis de comportamiento del cliente</li>
				<li>Detección de fraude</li>
				<li>Optimización de inventario</li>
			</ol>

			<h2>Tecnologías y Herramientas</h2>
			<p>Las principales herramientas utilizadas incluyen:</p>
			<ul>
				<li>Python con bibliotecas especializadas</li>
				<li>R para análisis estadístico</li>
				<li>Hadoop para procesamiento distribuido</li>
				<li>Tableau para visualización</li>
			</ul>

			<h2>Conclusiones</h2>
			<p>El análisis predictivo es una inversión valiosa para cualquier empresa que busque mantener una ventaja competitiva en el mercado actual.</p>
		`
	},
	{
		id: 'desarrollo-agil',
		title: 'Desarrollo Ágil: Metodologías Modernas',
		slug: 'desarrollo-agil',
		excerpt: 'Mejores prácticas en desarrollo de software utilizando metodologías ágiles.',
		image: '/images/blog/agile.jpg',
		category: 'Desarrollo',
		categories: ['Desarrollo', 'Metodologías', 'Tecnología'],
		date: '1 Enero 2024',
		author: 'Ana Martínez',
		authorRole: 'Scrum Master',
		authorImage: '/images/team/ana-martinez.jpg',
		tags: ['agile', 'scrum', 'desarrollo', 'metodologías'],
		readTime: 5,
		content: `
			<h2>Introducción a las Metodologías Ágiles</h2>
			<p>Las metodologías ágiles han transformado la forma en que desarrollamos software, permitiendo una mayor adaptabilidad y eficiencia en los proyectos.</p>

			<h2>Principios del Desarrollo Ágil</h2>
			<ul>
				<li>Entrega continua de valor</li>
				<li>Adaptación al cambio</li>
				<li>Colaboración con el cliente</li>
				<li>Equipos auto-organizados</li>
			</ul>

			<h2>Frameworks Ágiles Populares</h2>
			<h3>1. Scrum</h3>
			<p>Marco de trabajo iterativo que se centra en la entrega incremental de valor a través de sprints.</p>

			<h3>2. Kanban</h3>
			<p>Sistema visual que ayuda a gestionar y mejorar el flujo de trabajo.</p>

			<h3>3. XP (Extreme Programming)</h3>
			<p>Enfoque que enfatiza la calidad del código y las pruebas automatizadas.</p>

			<h2>Mejores Prácticas</h2>
			<ol>
				<li>Daily stand-ups efectivos</li>
				<li>Planificación iterativa</li>
				<li>Retrospectivas regulares</li>
				<li>Integración continua</li>
			</ol>

			<h2>Conclusiones</h2>
			<p>La adopción de metodologías ágiles es esencial para mantenerse competitivo en el desarrollo de software moderno.</p>
		`
	}
];

export function getAllPosts(): BlogPost[] {
	return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostsByFilters(filters: BlogFilters): BlogSearchResult {
	let filteredPosts = [...blogPosts];
	
	if (filters.category) {
		filteredPosts = filteredPosts.filter(post => 
			post.categories?.includes(filters.category || '')
		);
	}
	
	if (filters.tag) {
		filteredPosts = filteredPosts.filter(post => 
			post.tags.includes(filters.tag || '')
		);
	}
	
	if (filters.searchQuery) {
		const searchLower = filters.searchQuery.toLowerCase();
		filteredPosts = filteredPosts.filter(post => 
			post.title.toLowerCase().includes(searchLower) ||
			post.excerpt.toLowerCase().includes(searchLower) ||
			post.content.toLowerCase().includes(searchLower)
		);
	}
	
	const page = filters.page || 1;
	const limit = filters.limit || 10;
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
	
	return {
		posts: paginatedPosts,
		totalResults: filteredPosts.length,
		currentPage: page,
		totalPages: Math.ceil(filteredPosts.length / limit)
	};
}

export function getCategories(): BlogCategory[] {
	const categoryCount = blogPosts.reduce((acc, post) => {
		const category = post.category;
		acc[category] = (acc[category] || 0) + 1;
		post.categories?.forEach(cat => {
			acc[cat] = (acc[cat] || 0) + 1;
		});
		return acc;
	}, {} as Record<string, number>);
	
	return Object.entries(categoryCount)
		.map(([name, count]) => ({
			name,
			slug: name.toLowerCase().replace(/\s+/g, '-'),
			count
		}))
		.sort((a, b) => b.count - a.count);
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
	const currentPost = getPostBySlug(currentSlug);
	if (!currentPost) return [];
	
	return blogPosts
		.filter(post => post.slug !== currentSlug)
		.filter(post => {
			// Verificar categorías compartidas
			const sharedCategories = post.categories?.some(cat => 
				currentPost.categories?.includes(cat)
			);
			// Verificar tags compartidos
			const sharedTags = post.tags.some(tag => 
				currentPost.tags.includes(tag)
			);
			return sharedCategories || sharedTags;
		})
		.sort((a, b) => {
			// Priorizar posts con más elementos en común
			const aCommon = countCommonElements(currentPost, a);
			const bCommon = countCommonElements(currentPost, b);
			return bCommon - aCommon;
		})
		.slice(0, limit);
}

function countCommonElements(post1: BlogPost, post2: BlogPost): number {
	const commonCategories = post1.categories?.filter(cat => 
		post2.categories?.includes(cat)
	).length || 0;
	
	const commonTags = post1.tags.filter(tag => 
		post2.tags.includes(tag)
	).length;
	
	return commonCategories + commonTags;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
	return blogPosts.find(post => post.slug === slug);
}

export const getPostsByCategory = (category: string) => {
	// Implementar lógica para filtrar posts por categoría
	return [];
};

export const searchPosts = (query: string) => {
	// Implementar lógica de búsqueda
	return [];
};
