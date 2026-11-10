import { FileItem } from '../types/os';

const STORAGE_KEY = 'win11_filesystem_v1';

const DEFAULT_FILES: FileItem[] = [
  // Root folders
  {
    id: 'folder_desktop',
    name: 'Escritorio',
    type: 'folder',
    parentId: null,
    path: '/Escritorio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: 'folder_documents',
    name: 'Documentos',
    type: 'folder',
    parentId: null,
    path: '/Documentos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: 'folder_downloads',
    name: 'Descargas',
    type: 'folder',
    parentId: null,
    path: '/Descargas',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: 'folder_pictures',
    name: 'Imágenes',
    type: 'folder',
    parentId: null,
    path: '/Imágenes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  {
    id: 'folder_music',
    name: 'Música',
    type: 'folder',
    parentId: null,
    path: '/Música',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystem: true,
  },
  // Desktop items
  {
    id: 'file_welcome',
    name: 'Bienvenido a Windows 11.txt',
    type: 'file',
    parentId: 'folder_desktop',
    path: '/Escritorio/Bienvenido a Windows 11.txt',
    extension: 'txt',
    content: `========================================================
BIENVENIDO AL SIMULADOR DE WINDOWS 11
========================================================

¡Hola! Has iniciado sesión en el Windows Desktop Simulator.

Este sistema operativo virtual cuenta con:
- Administrador de ventanas flotantes con arrastre y redimensionado.
- Barra de tareas interactiva con menú de inicio y centro de notificaciones.
- Explorador de archivos con soporte para crear, mover y editar archivos.
- Bloc de notas completo con edición y guardado.
- Calculadora con modo estándar e historial de operaciones.
- Navegador web con navegación por pestañas y marcadores.
- Administrador de tareas con métricas de rendimiento y monitor de procesos.
- Reproductor multimedia con soporte para audio y video.
- Calendario interactivo con agenda de eventos.
- Paint con herramientas de dibujo y descarga en PNG.
- Símbolo del sistema (Terminal) con comandos simulados.
- Papelera de reciclaje con restauración de archivos.
- Panel de Configuración para personalizar fondos, temas y colores.

¡Disfruta explorando todas las aplicaciones!`,
    size: 980,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'file_guide',
    name: 'Guía de Atajos y Consejos.txt',
    type: 'file',
    parentId: 'folder_desktop',
    path: '/Escritorio/Guía de Atajos y Consejos.txt',
    extension: 'txt',
    content: `CONSEJOS RÁPIDOS:

1. Doble clic en cualquier icono del escritorio para abrir la aplicación.
2. Clic derecho en el escritorio para abrir el Menú Contextual (crear carpetas, archivos de texto, personalizar).
3. Arrastra las ventanas desde la barra de título superior para moverlas libremente.
4. Redimensiona ventanas jalando de los bordes o esquinas.
5. Puedes maximizar una ventana haciendo doble clic en su barra de título.
6. En la barra de tareas inferior tienes el Menú de Inicio, Búsqueda, Configuración Rápida y Notificaciones.
7. Tus cambios en archivos, notas y configuraciones se guardan automáticamente en tu navegador.`,
    size: 620,
    createdAt: new Date(Date.now() - 72000000).toISOString(),
    updatedAt: new Date(Date.now() - 72000000).toISOString(),
  },
  {
    id: 'folder_proyectos_desktop',
    name: 'Mis Proyectos',
    type: 'folder',
    parentId: 'folder_desktop',
    path: '/Escritorio/Mis Proyectos',
    createdAt: new Date(Date.now() - 36000000).toISOString(),
    updatedAt: new Date(Date.now() - 36000000).toISOString(),
  },
  {
    id: 'file_proyectos_info',
    name: 'ideas_2026.txt',
    type: 'file',
    parentId: 'folder_proyectos_desktop',
    path: '/Escritorio/Mis Proyectos/ideas_2026.txt',
    extension: 'txt',
    content: `- Proyecto Sistema Operativo Web: En desarrollo activo.
- Soporte para multitarea fluida y ventanas redimensionables.
- Modo oscuro y fondos Fluent Design completados.`,
    size: 154,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    updatedAt: new Date(Date.now() - 18000000).toISOString(),
  },
  // Documents items
  {
    id: 'file_doc1',
    name: 'Presupuesto_Anual.txt',
    type: 'file',
    parentId: 'folder_documents',
    path: '/Documentos/Presupuesto_Anual.txt',
    extension: 'txt',
    content: `PRESUPUESTO ESTIMADO 2026
-------------------------
Hardware & Equipos:   $2,400 USD
Licencias de Software:  $750 USD
Servidores & Cloud:    $1,200 USD
Total Estimado:        $4,350 USD`,
    size: 180,
    createdAt: new Date(Date.now() - 120000000).toISOString(),
    updatedAt: new Date(Date.now() - 120000000).toISOString(),
  },
  // Downloads items
  {
    id: 'file_download_manual',
    name: 'manual_windows11.txt',
    type: 'file',
    parentId: 'folder_downloads',
    path: '/Descargas/manual_windows11.txt',
    extension: 'txt',
    content: `Manual de usuario básico de la interfaz de escritorio virtual.`,
    size: 64,
    createdAt: new Date(Date.now() - 50000000).toISOString(),
    updatedAt: new Date(Date.now() - 50000000).toISOString(),
  },
];

export class FileSystemService {
  private static currentUserId: string | null = null;

  public static setCurrentUserId(uid: string | null): void {
    this.currentUserId = uid;
  }

  private static getStorageKey(): string {
    return this.currentUserId ? `win11_filesystem_${this.currentUserId}` : STORAGE_KEY;
  }

  public static setStoredFiles(files: FileItem[]): void {
    this.saveFiles(files);
  }

  private static getStoredFiles(): FileItem[] {
    try {
      const key = this.getStorageKey();
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error loading filesystem from localStorage:', e);
    }
    this.saveFiles(DEFAULT_FILES);
    return DEFAULT_FILES;
  }

  private static saveFiles(files: FileItem[]): void {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(files));
    } catch (e) {
      console.error('Error saving filesystem to localStorage:', e);
    }
  }

  public static getAllFiles(): FileItem[] {
    return this.getStoredFiles();
  }

  public static getFolderItems(parentId: string | null): FileItem[] {
    const files = this.getStoredFiles();
    return files.filter(f => f.parentId === parentId && !f.isDeleted);
  }

  public static getDesktopItems(): FileItem[] {
    return this.getFolderItems('folder_desktop');
  }

  public static getRecycleBinItems(): FileItem[] {
    const files = this.getStoredFiles();
    return files.filter(f => f.isDeleted);
  }

  public static getItemById(id: string): FileItem | undefined {
    const files = this.getStoredFiles();
    return files.find(f => f.id === id);
  }

  public static createFolder(parentId: string | null, name: string): FileItem {
    const files = this.getStoredFiles();
    const parent = parentId ? files.find(f => f.id === parentId) : null;
    const parentPath = parent ? parent.path : '';
    const newPath = `${parentPath}/${name}`.replace('//', '/');

    const newFolder: FileItem = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      type: 'folder',
      parentId,
      path: newPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    files.push(newFolder);
    this.saveFiles(files);
    return newFolder;
  }

  public static createFile(
    parentId: string | null,
    name: string,
    content: string = '',
    extension: string = 'txt'
  ): FileItem {
    const files = this.getStoredFiles();
    const parent = parentId ? files.find(f => f.id === parentId) : null;
    const parentPath = parent ? parent.path : '';
    const fullName = name.includes('.') ? name : `${name}.${extension}`;
    const newPath = `${parentPath}/${fullName}`.replace('//', '/');

    const newFile: FileItem = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: fullName,
      type: 'file',
      parentId,
      path: newPath,
      extension: fullName.split('.').pop() || extension,
      content,
      size: new Blob([content]).size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    files.push(newFile);
    this.saveFiles(files);
    return newFile;
  }

  public static updateFileContent(id: string, content: string): FileItem | null {
    const files = this.getStoredFiles();
    const index = files.findIndex(f => f.id === id);
    if (index === -1) return null;

    files[index] = {
      ...files[index],
      content,
      size: new Blob([content]).size,
      updatedAt: new Date().toISOString(),
    };

    this.saveFiles(files);
    return files[index];
  }

  public static renameItem(id: string, newName: string): FileItem | null {
    const files = this.getStoredFiles();
    const index = files.findIndex(f => f.id === id);
    if (index === -1) return null;

    const oldItem = files[index];
    const pathParts = oldItem.path.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');

    files[index] = {
      ...oldItem,
      name: newName,
      path: newPath,
      updatedAt: new Date().toISOString(),
    };

    this.saveFiles(files);
    return files[index];
  }

  public static moveToRecycleBin(id: string): boolean {
    const files = this.getStoredFiles();
    const index = files.findIndex(f => f.id === id);
    if (index === -1) return false;

    // Do not allow deleting system root folders
    if (files[index].isSystem) return false;

    files[index] = {
      ...files[index],
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    };

    this.saveFiles(files);
    return true;
  }

  public static restoreFromRecycleBin(id: string): boolean {
    const files = this.getStoredFiles();
    const index = files.findIndex(f => f.id === id);
    if (index === -1) return false;

    files[index] = {
      ...files[index],
      isDeleted: false,
      updatedAt: new Date().toISOString(),
    };

    this.saveFiles(files);
    return true;
  }

  public static deletePermanently(id: string): boolean {
    let files = this.getStoredFiles();
    const initialLen = files.length;
    files = files.filter(f => f.id !== id);
    if (files.length !== initialLen) {
      this.saveFiles(files);
      return true;
    }
    return false;
  }

  public static emptyRecycleBin(): void {
    const files = this.getStoredFiles().filter(f => !f.isDeleted);
    this.saveFiles(files);
  }

  public static resetToDefault(): void {
    this.saveFiles(DEFAULT_FILES);
  }
}
