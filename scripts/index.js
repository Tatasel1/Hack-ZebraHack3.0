document.addEventListener("DOMContentLoaded", () => {

    const zebraApi = ZebraHackApi.createClient({
        appKey: "MecDonalt",
    });

    let map = L.map('map').setView([45.95, 25.00], 7);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const routesLayerGroup = L.layerGroup().addTo(map);
    let currentCompanyLayer = null;

    const drawRoutesOnMap = (routes) => {
        const bounds = L.latLngBounds();
        let hasValidGeo = false;

        routes.forEach(route => {
            if (!route.geometry) return;

            const defaultStyle = {
                color: "#3388ff",
                weight: 3,
                opacity: 0.7
            };

            const geoData = typeof route.geometry === 'string' ? JSON.parse(route.geometry) : route.geometry;

            const layer = L.geoJSON(geoData, {
                style: defaultStyle
            });

            layer.routeId = route.transport_id;

            layer.on('click', () => {
                highlightRoute(layer.routeId);
            });

            routesLayerGroup.addLayer(layer);

            bounds.extend(layer.getBounds());
            hasValidGeo = true;
        });

        if (hasValidGeo) {
            map.fitBounds(bounds, { padding: [5, 5], maxZoom: 19 });
        }
    };

    const highlightRoute = (routeId) => {
        routesLayerGroup.eachLayer(layer => {
            layer.setStyle({
                color: "#3388ff",
                weight: 3,
                opacity: 0.7
            });

            if (layer.routeId == routeId) {
                layer.setStyle({
                    color: "#ff0000",
                    weight: 6,
                    opacity: 1.0
                });
                layer.bringToFront();
            }
        });

        const rows = document.querySelectorAll("#routes-body tr");
        rows.forEach(r => r.style.backgroundColor = "transparent");

        const selectedRow = document.getElementById(`route-row-${routeId}`);
        if (selectedRow) {
            selectedRow.style.backgroundColor = "#ffa1a1ff";
            selectedRow.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const selectRoute = (route) => {
        const routeId = route.transport_id || route.id;

        routesLayerGroup.clearLayers();

        if (route.geometry) {
            try {
                const geoData = typeof route.geometry === 'string' ? JSON.parse(route.geometry) : route.geometry;

                const layer = L.geoJSON(geoData, {
                    style: { color: "#ff0000", weight: 5, opacity: 1.0 }
                });

                if (layer.getLayers().length > 0) {
                    const center = layer.getBounds().getCenter();
                    if (center.lat && center.lng && Math.abs(center.lat) > 1) {
                        routesLayerGroup.addLayer(layer);
                        map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 15 });
                    }
                }
            } catch (e) {
                console.error("Geometrie invalidă pentru ruta", routeId);
            }
        }

        const rows = document.querySelectorAll("#routes-body tr");
        rows.forEach(r => {
            r.style.backgroundColor = r.dataset.originalColor || "transparent";
            r.style.borderLeft = "none";
            r.style.fontWeight = "normal";
        });

        const selectedRow = document.getElementById(`route-row-${routeId}`);
        if (selectedRow) {
            selectedRow.style.backgroundColor = "#b3d9ff";
            selectedRow.style.borderLeft = "5px solid #007bff";
            selectedRow.style.fontWeight = "bold";
        }
    };

    const buttonLoadRoutes = document.getElementById("load-routes-btn");

    const loadRoutes = async (companyName, companyRole) => {

        const tbody = document.getElementById("routes-body");
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Se caută rute pentru ' + companyName + '...</td></tr>';

        routesLayerGroup.clearLayers();
        try {
            const response = await zebraApi.getRoutes(companyRole, companyName);

            let routes = [];
            if (Array.isArray(response)) {
                routes = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                routes = response.data;
            } else if (response && response.routes && Array.isArray(response.routes)) {
                routes = response.routes;
            }

            tbody.innerHTML = "";

            if (!routes || routes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nu au fost găsite rute.</td></tr>';
                return;
            }

            drawRoutesOnMap(routes);
            routes.forEach((route, index) => {
                const tr = document.createElement("tr");
                const currentRouteId = route.transport_id || route.id;

                tr.id = `route-row-${currentRouteId}`;

                if (index > 20) {
                    tr.style.display = "none";
                    tr.classList.add("hidden-route");
                }

                tr.addEventListener("click", () => {
                    selectRoute(route);
                });

                let totalVolume = 0;
                let speciesText = "N/A";
                if (Array.isArray(route.species)) {
                    totalVolume = route.species.reduce((sum, s) => sum + (s.volume || 0), 0);

                    speciesText = route.species
                        .map(s => `${s.name || s.species_name || 'Specie'}: ${s.volume}m³`)
                        .join(", ");
                }
                const dateStr = route.updated_at ? new Date(route.updated_at).toLocaleString('ro-RO') : "-";

                let rowColor = "transparent";
                if (totalVolume > 0) {
                    if (totalVolume < 10) {
                        rowColor = "#e8f5e9";
                    } else if (totalVolume < 40) {
                        rowColor = "#fff9c4";
                    } else {
                        rowColor = "#ffccbc";
                    }
                }

                tr.style.backgroundColor = rowColor;
                tr.dataset.originalColor = rowColor;

                tr.innerHTML = `
                    <td style="border: 1px solid #ddd; padding: 4px;">
                        <b>#${route.transport_id}</b>
                        <br>
                        <small style="color: #555;">Aviz: ${route.notice_id || '-'}</small>
                    </td>
                    <td style="border: 1px solid #ddd; padding: 4px;">${speciesText}</td>
                    <td style="border: 1px solid #ddd; padding: 4px;">${route.point_count || 0}</td>
                    <td style="border: 1px solid #ddd; padding: 4px;">${dateStr}</td>
                `;
                tbody.appendChild(tr);

            })

            if (routes.length > 20) {
                buttonLoadRoutes.style.display = "block";
            } else {
                buttonLoadRoutes.style.display = "none";
            }

        } catch (err) {
            console.error("Eroare API:", err);
            tbody.innerHTML = `<tr><td colspan="4" style="color:red;">Eroare: ${err.message}</td></tr>`;
        }

        nr_routes_loaded = routes.length;
    };

    buttonLoadRoutes.addEventListener("click", async () => {
        const hiddenRows = document.querySelectorAll(".hidden-route");

        const rowsToShow = Array.from(hiddenRows);
        rowsToShow.forEach(row => {
            row.style.display = "";
            row.classList.remove("hidden-route");
        });

        const remainingHidden = hiddenRows.length - rowsToShow.length;
        if (remainingHidden <= 0) {
            buttonLoadRoutes.style.display = "none";
        } else {
            buttonLoadRoutes.textContent = `Încarcă mai multe transporturi (${remainingHidden} rămase)`;
        }
    });

    const search = document.getElementById("company-search");
    const role = document.getElementById("role-selector");
    const buttonCompany = document.getElementById("company-btn");
    const statusCompany = document.getElementById("company-status");
    const elementsList = document.getElementById("company-list");

    const searchCompany = async (event) => {
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }

        elementsList.innerHTML = "";
        statusCompany.textContent = "Cautare companii...";
        statusCompany.style.color = "blue";

        const roleValue = role.value;
        const searchValue = search.value.trim();

        try {
            const companies = await zebraApi.getCompanies(roleValue, searchValue);

            let list = [];

            if (Array.isArray(companies)) {
                list = companies;
            } else if (companies && Array.isArray(companies.data)) {
                list = companies.data;
            } else if (companies && Array.isArray(companies.companies)) {
                list = companies.companies;
            } else {
                throw new Error("Invalid response format");
            }

            if (list.length === 0) {
                statusCompany.textContent = "Nicio companie gasita.";
                statusCompany.style.color = "red";
                return;
            }

            statusCompany.textContent = `Găsite ${list.length} companii.`;
            statusCompany.style.color = "green";

            list.forEach(element => {
                const li = document.createElement("li");
                li.className = "company-card";

                const badgeColor = element.role === "emitent" ? "green" : "blue";

                li.innerHTML = `
                <div id="company-info">
                  <strong>${element.name}</strong>
                  <span style="color: ${badgeColor}; border: 1px solid ${badgeColor}; padding: 2px 5px; border-radius: 4px; font-size: 0.8em; margin-left: 5px;">
                    ${element.role || 'N/A'}
                  </span>
                  <br>
                  <small>Transporturi: ${element.transport_count || 0}</small>
                </div>
                `;
                elementsList.appendChild(li);

                li.addEventListener("click", () => {

                    const container = document.getElementById("details-container");
                    container.style.display = "block";

                    document.getElementById("det-name").textContent = element.name;
                    document.getElementById("det-role").textContent = element.role || 'N/A';

                    const radiusText = element.radius_meters ? (element.radius_meters / 1000).toFixed(2) : (element.radius || '0');
                    document.getElementById("det-radius").textContent = radiusText;

                    let centerText = 'N/A';
                    if (element.center) {
                        const lat = element.center.latitude || element.center.lat;
                        const lng = element.center.longitude || element.center.lng;
                        if (lat && lng) {
                            centerText = `[${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}]`;
                        }
                    }
                    document.getElementById("det-center").textContent = centerText;

                    document.getElementById("det-last").textContent = element.last_seen || element.last_activity || 'N/A';
                    if (currentCompanyLayer) {
                        map.removeLayer(currentCompanyLayer);
                    }

                    if (element.center && element.radius_meters) {
                        const lat = element.center.lat || element.center.latitude;
                        const lng = element.center.lng || element.center.longitude;

                        if (lat && lng) {
                            currentCompanyLayer = L.circle([lat, lng], {
                                color: 'red',
                                fillColor: '#f03',
                                fillOpacity: 0.2,
                                radius: element.radius_meters
                            }).addTo(map);
                            map.fitBounds(currentCompanyLayer.getBounds());
                        }
                    }

                    loadRoutes(element.name, element.role);

                });

            });
            console.log(companies);
        } catch (err) {
            alert(`Company search failed: ${err.message}`);
        }
    };

    buttonCompany.addEventListener("click", searchCompany);

});
