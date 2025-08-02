import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { sendTicketNotification } from '@/lib/email-notifications';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
}

export default function CreateTicket() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    categoryId: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    setCategories(data || []);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return false;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'video/mp4', 'video/webm', 'video/ogg',
        'audio/mpeg', 'audio/wav', 'audio/ogg'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return false;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'video/mp4', 'video/webm', 'video/ogg',
        'audio/mpeg', 'audio/wav', 'audio/ogg'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!formData.title.trim() || !formData.description.trim() || !formData.categoryId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          category_id: formData.categoryId,
          creator_id: profile.id,
          status: 'open',
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Upload attachments if any
      if (attachments.length > 0) {
        const uploadedFiles = [];
        const failedFiles = [];
        
        console.log('Starting file upload process for', attachments.length, 'files');
        
        for (const file of attachments) {
          try {
            console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
            
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = `tickets/${ticket.id}/${fileName}`;
            
            console.log('Uploading to path:', filePath);
            
            const { error: uploadError } = await supabase.storage
              .from('attachments')
              .upload(filePath, file);
            
            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              failedFiles.push({ name: file.name, error: uploadError.message });
              continue;
            }
            
            console.log('File uploaded successfully to storage');
            
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('attachments')
              .getPublicUrl(filePath);
            
            console.log('Public URL generated:', urlData.publicUrl);
            
            // Save file info to database
            const { error: dbError } = await supabase
              .from('ticket_attachments')
              .insert({
                ticket_id: ticket.id,
                file_name: file.name,
                file_path: filePath,
                file_size: file.size,
                file_type: file.type,
                uploaded_by: profile.id
              });
            
            if (dbError) {
              console.error('Error saving file info to database:', dbError);
              failedFiles.push({ name: file.name, error: dbError.message });
            } else {
              uploadedFiles.push(file.name);
              console.log('File saved to database:', file.name, 'for ticket:', ticket.id);
            }
          } catch (error: any) {
            console.error('Error processing file:', error);
            failedFiles.push({ name: file.name, error: error.message || 'Unknown error' });
          }
        }
        
        console.log('Upload process completed. Successfully uploaded:', uploadedFiles.length, 'files');
        console.log('Failed uploads:', failedFiles.length, 'files');
        
        if (uploadedFiles.length > 0) {
          toast({
            title: "Files Uploaded",
            description: `Successfully uploaded ${uploadedFiles.length} file(s).`,
          });
        }
        
        if (failedFiles.length > 0) {
          toast({
            title: "Some Files Failed",
            description: `${failedFiles.length} file(s) failed to upload. Check console for details.`,
            variant: "destructive",
          });
        }
      }

      // Send email notification
      await sendTicketNotification(ticket.id, 'created');

      toast({
        title: "Ticket Created",
        description: "Your support ticket has been created successfully.",
      });

      navigate(`/tickets/${ticket.id}`);

    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Ticket</h1>
        <p className="text-muted-foreground mt-1">
          Describe your issue and we'll help you resolve it
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of your issue"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about your issue..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                required
              />
            </div>

            {/* File upload */}
            <div className="space-y-4">
              <Label>Attachments</Label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.webm,.ogg,.mp3,.wav"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload files or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                      Max 10MB per file. Supported: Images, PDF, DOC, TXT, Video, Audio
                    </span>
                  </div>
                </label>
              </div>
              
              {/* Display selected files */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files ({attachments.length})</Label>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/tickets')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Ticket
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}