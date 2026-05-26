import type { Request, Response } from "express";
import {
	createExemple,
	deleteExemple,
	findExempleById,
	updateExemple,
} from "../services/exempleService.js";

export function getOne(req: Request, res: Response): void {
	const _propsParams = req.params;
	const _propsBody = req.body;
	const _propsQuery = req.query;
	const _propsConfig = req.config;
	const exemple = findExempleById();
	res.json({ data: exemple });
}

export function postOne(req: Request, res: Response): void {
	const _propsParams = req.params;
	const _propsBody = req.body;
	const _propsQuery = req.query;
	const _propsConfig = req.config;
	const exemple = createExemple();
	res.status(201).json({ data: exemple });
}

export function patchOne(req: Request, res: Response): void {
	const _propsParams = req.params;
	const _propsBody = req.body;
	const _propsQuery = req.query;
	const _propsConfig = req.config;
	const exemple = updateExemple();
	res.json({ data: exemple });
}

export function deleteOne(req: Request, res: Response): void {
	const _propsParams = req.params;
	const _propsBody = req.body;
	const _propsQuery = req.query;
	const _propsConfig = req.config;
	const _removed = deleteExemple();
	res.status(204).send();
}
