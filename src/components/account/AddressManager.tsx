import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Check, X, Star } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SavedAddress {
  id: string;
  label: string;
  street_address: string;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface AddressManagerProps {
  addresses: SavedAddress[];
  loading: boolean;
  onRefresh: () => void;
}

// Country configurations with locale-appropriate field labels and formatting
const COUNTRY_CONFIGS: Record<string, {
  name: string;
  addressLine1Label: string;
  addressLine2Placeholder: string;
  cityLabel: string;
  stateLabel: string | null;
  postalCodeLabel: string;
  postalCodePlaceholder: string;
  stateOptions?: string[];
}> = {
  'United Kingdom': {
    name: 'United Kingdom',
    addressLine1Label: 'Address Line 1',
    addressLine2Placeholder: 'Flat, suite, unit, etc. (optional)',
    cityLabel: 'City / Town',
    stateLabel: 'County',
    postalCodeLabel: 'Postcode',
    postalCodePlaceholder: 'SW1A 1AA',
    stateOptions: undefined,
  },
  'South Africa': {
    name: 'South Africa',
    addressLine1Label: 'Street Address',
    addressLine2Placeholder: 'Complex, unit, building (optional)',
    cityLabel: 'City / Town',
    stateLabel: 'Province',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '2000',
    stateOptions: [
      'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
      'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
    ],
  },
  'United States': {
    name: 'United States',
    addressLine1Label: 'Street Address',
    addressLine2Placeholder: 'Apt, suite, unit, etc. (optional)',
    cityLabel: 'City',
    stateLabel: 'State',
    postalCodeLabel: 'ZIP Code',
    postalCodePlaceholder: '10001',
    stateOptions: [
      'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
      'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
      'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
      'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
      'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
      'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
      'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
      'Wisconsin','Wyoming','District of Columbia',
    ],
  },
  'Canada': {
    name: 'Canada',
    addressLine1Label: 'Street Address',
    addressLine2Placeholder: 'Apt, suite, unit, etc. (optional)',
    cityLabel: 'City',
    stateLabel: 'Province / Territory',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: 'K1A 0B1',
    stateOptions: [
      'Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador',
      'Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island',
      'Quebec','Saskatchewan','Yukon',
    ],
  },
  'Cyprus': {
    name: 'Cyprus',
    addressLine1Label: 'Street Address',
    addressLine2Placeholder: 'Building, floor, apartment (optional)',
    cityLabel: 'City / Town',
    stateLabel: 'District',
    postalCodeLabel: 'Postal Code',
    postalCodePlaceholder: '1000',
    stateOptions: [
      'Famagusta', 'Kyrenia', 'Larnaca', 'Limassol', 'Nicosia', 'Paphos',
    ],
  },
  'Australia': {
    name: 'Australia',
    addressLine1Label: 'Street Address',
    addressLine2Placeholder: 'Unit, suite, level (optional)',
    cityLabel: 'City / Suburb',
    stateLabel: 'State / Territory',
    postalCodeLabel: 'Postcode',
    postalCodePlaceholder: '2000',
    stateOptions: [
      'Australian Capital Territory', 'New South Wales', 'Northern Territory',
      'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
    ],
  },
};

// All other countries use a generic config
const DEFAULT_CONFIG = {
  name: '',
  addressLine1Label: 'Street Address',
  addressLine2Placeholder: 'Apartment, suite, etc. (optional)',
  cityLabel: 'City',
  stateLabel: 'State / Region',
  postalCodeLabel: 'Postal Code',
  postalCodePlaceholder: '',
  stateOptions: undefined as string[] | undefined,
};

const ALL_COUNTRIES = [
  'United Kingdom', 'South Africa', 'United States', 'Cyprus', 'Canada', 'Australia',
  '---',
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus',
  'Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil',
  'Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon',
  'Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',
  'Croatia','Cuba','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic',
  'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
  'Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada',
  'Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India',
  'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
  'Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia',
  'Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives',
  'Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova',
  'Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal',
  'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Macedonia','Norway','Oman',
  'Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines',
  'Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia',
  'Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia',
  'Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia',
  'Solomon Islands','Somalia','South Korea','South Sudan','Spain','Sri Lanka','Sudan',
  'Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand',
  'Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan',
  'Tuvalu','Uganda','Ukraine','United Arab Emirates','Uruguay','Uzbekistan','Vanuatu',
  'Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

const LABELS = ['Home', 'Work', 'Other'];

const AddressManager = ({ addresses, loading, onRefresh }: AddressManagerProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form fields
  const [label, setLabel] = useState('Home');
  const [country, setCountry] = useState('United Kingdom');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const config = COUNTRY_CONFIGS[country] || { ...DEFAULT_CONFIG, name: country };

  const resetForm = () => {
    setLabel('Home');
    setCountry('United Kingdom');
    setStreetAddress('');
    setCity('');
    setState('');
    setPostalCode('');
    setIsDefault(false);
    setEditingId(null);
    setIsEditing(false);
  };

  const openNew = () => {
    resetForm();
    if (addresses.length === 0) setIsDefault(true);
    setIsEditing(true);
  };

  const openEdit = (addr: SavedAddress) => {
    setLabel(addr.label);
    setCountry(addr.country);
    setStreetAddress(addr.street_address);
    setCity(addr.city);
    setState(addr.state || '');
    setPostalCode(addr.postal_code);
    setIsDefault(addr.is_default);
    setEditingId(addr.id);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!streetAddress.trim() || !city.trim() || !postalCode.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // If setting as default, unset others first
      if (isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const addressData = {
        user_id: user.id,
        label,
        street_address: streetAddress.trim(),
        city: city.trim(),
        state: state.trim() || null,
        postal_code: postalCode.trim(),
        country,
        is_default: isDefault,
      };

      if (editingId) {
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', editingId)
          .eq('user_id', user.id);
        if (error) throw error;
        toast.success('Address updated');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert(addressData);
        if (error) throw error;
        toast.success('Address added');
      }

      resetForm();
      onRefresh();
    } catch (error) {
      logger.error('Failed to save address', error);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', deleteId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Address deleted');
      setDeleteId(null);
      onRefresh();
    } catch (error) {
      logger.error('Failed to delete address', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      // Unset all
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
      // Set selected
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Default address updated');
      onRefresh();
    } catch (error) {
      logger.error('Failed to set default', error);
      toast.error('Failed to update default address');
    }
  };

  const formatAddress = (addr: SavedAddress) => {
    const parts = [addr.street_address, addr.city];
    if (addr.state) parts.push(addr.state);
    parts.push(addr.postal_code);
    parts.push(addr.country);
    return parts;
  };

  if (loading) return <div className="text-muted-foreground">Loading addresses...</div>;

  return (
    <div className="space-y-6">
      {/* Address list */}
      {addresses.length > 0 && !isEditing && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`relative p-4 border rounded transition-colors ${
                addr.is_default ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{addr.label}</span>
                  {!!addr.is_default && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" /> Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {!addr.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleSetDefault(addr.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(addr)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(addr.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-0.5">
                {formatAddress(addr).map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {addresses.length === 0 && !isEditing && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No saved addresses yet</p>
          <Button onClick={openNew} className="rounded-none">
            <Plus className="h-4 w-4 mr-2" /> Add Your First Address
          </Button>
        </div>
      )}

      {/* Add button (when addresses exist) */}
      {addresses.length > 0 && !isEditing && (
        <Button onClick={openNew} variant="outline" className="rounded-none">
          <Plus className="h-4 w-4 mr-2" /> Add New Address
        </Button>
      )}

      {/* Address form */}
      {isEditing && (
        <Card className="rounded-none">
          <CardContent className="pt-6 space-y-4">
            <h3 className="font-medium text-lg">
              {editingId ? 'Edit Address' : 'Add New Address'}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Label */}
              <div className="space-y-2">
                <Label>Address Label</Label>
                <Select value={label} onValueChange={setLabel}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LABELS.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={country} onValueChange={(v) => { setCountry(v); setState(''); }}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {ALL_COUNTRIES.map((c, i) =>
                      c === '---' ? (
                        <div key={`sep-${i}`} className="h-px bg-border my-1" />
                      ) : (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Street */}
            <div className="space-y-2">
              <Label>{config.addressLine1Label} *</Label>
              <Input
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder={config.addressLine2Placeholder}
                className="rounded-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* City */}
              <div className="space-y-2">
                <Label>{config.cityLabel} *</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-none"
                />
              </div>

              {/* State / Province / County */}
              {config.stateLabel && (
                <div className="space-y-2">
                  <Label>{config.stateLabel}</Label>
                  {config.stateOptions ? (
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger className="rounded-none">
                        <SelectValue placeholder={`Select ${config.stateLabel}`} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {config.stateOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder={config.stateLabel}
                      className="rounded-none"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Postal Code */}
            <div className="sm:w-1/2 space-y-2">
              <Label>{config.postalCodeLabel} *</Label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder={config.postalCodePlaceholder}
                className="rounded-none"
              />
            </div>

            {/* Default checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-border"
              />
              Set as default address
            </label>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="rounded-none">
                <Check className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
              </Button>
              <Button variant="outline" onClick={resetForm} className="rounded-none">
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Address</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this address? This cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddressManager;
