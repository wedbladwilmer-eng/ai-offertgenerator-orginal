import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Product } from "@/hooks/useProducts";

interface ProductDisplayProps {
  product: Product;
  onAddToQuote: (product: Product, quantity: number) => void;
}

const ProductDisplay = ({ product, onAddToQuote }: ProductDisplayProps) => {
