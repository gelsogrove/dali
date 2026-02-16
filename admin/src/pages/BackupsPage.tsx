import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Database, Download, Plus, HardDrive, ShieldCheck, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Backup {
    filename: string
    size: number
    created_at: string
}

export default function BackupsPage() {

    const { data, isLoading } = useQuery({
        queryKey: ['backups'],
        queryFn: async () => {
            const res = await api.get('/backups')
            return res.data
        },
    })

    const backups: Backup[] = data?.data || []

    const handleDownload = async (filename: string) => {
        try {
            const response = await api.get(`/backups/download/${filename}`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            toast.success('Download started!')
        } catch (error) {
            toast.error('Error during download')
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Database Backups</h1>
                    <p className="text-muted-foreground">
                        Monitor and download manual security copies of your database.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg text-primary">
                        <HardDrive className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Backups</p>
                        <p className="text-2xl font-bold">{backups.length} / 5</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-lg text-green-600">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Security Status</p>
                        <p className="text-2xl font-bold text-green-600">Active</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Last Backup</p>
                        <p className="text-lg font-bold">
                            {backups[0] ? new Date(backups[0].created_at).toLocaleDateString() : 'Never'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Database className="h-5 w-5 text-gray-500" />
                        Backup History (Last 5)
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Filename</th>
                                <th className="px-6 py-4 font-semibold text-center">Date</th>
                                <th className="px-6 py-4 font-semibold text-center">Size</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                                            Loading backups...
                                        </div>
                                    </td>
                                </tr>
                            ) : backups.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No backups found.
                                    </td>
                                </tr>
                            ) : (
                                backups.map((backup) => (
                                    <tr key={backup.filename} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 border-l-4 border-transparent hover:border-primary">
                                            <div className="flex items-center gap-3">
                                                <Database className="h-4 w-4 text-gray-400" />
                                                {backup.filename}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600 italic">
                                            {new Date(backup.created_at).toLocaleString('en-US')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-mono">
                                                {formatSize(backup.size)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownload(backup.filename)}
                                                className="flex items-center gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary"
                                            >
                                                <Download className="h-4 w-4" />
                                                Download SQL
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl flex gap-4 items-start">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-amber-900 mb-1">Security Note</h3>
                        <p className="text-amber-800 text-sm leading-relaxed">
                            SQL files contain the entire structure and data of your database. Keep them secure.
                            The system automatically keeps only the <strong>last 5 backups</strong> to optimize server space.
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl flex gap-4 items-start">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Plus className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1">How to Create a Backup</h3>
                        <p className="text-blue-800 text-sm leading-relaxed mb-3">
                            For security reasons, manual backups must be triggered via command line:
                        </p>
                        <div className="bg-blue-900 text-blue-50 p-2 rounded font-mono text-xs">
                            npm run backup
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
