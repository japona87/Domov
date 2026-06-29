ALTER TABLE properties ADD COLUMN parent_property_id UUID REFERENCES properties(id);
CREATE INDEX idx_properties_parent ON properties(parent_property_id);
