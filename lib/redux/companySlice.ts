import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const companyApi = createApi({
	reducerPath: "companyApi",
	baseQuery: fetchBaseQuery({
		baseUrl: "https://dse-backend-uv5d.onrender.com0/company",
		credentials: "include",
	}),
	endpoints: (builder) => ({
		getCompanies: builder.query<any, void>({
			query: () => "companies",
		}),
		getCompany: builder.query<any, string>({
			query: (id) => `get/${id}`,
		}),
		addCompany: builder.mutation({
			query: (company) => ({
				url: "add",
				method: "POST",
				body: company,
			}),
		}),
		editCompany: builder.mutation({
			query: (company) => ({
				url: "edit",
				method: "PUT",
				body: company,
			}),
		}),
		deleteCompany: builder.mutation({
			query: (id: string) => ({
				url: `delete/${id}`,
				method: "DELETE",
			}),
		}),
	}),
});

export const {
	useGetCompaniesQuery,
	useAddCompanyMutation,
	useGetCompanyQuery,
	useEditCompanyMutation,
	useDeleteCompanyMutation,
} = companyApi;
