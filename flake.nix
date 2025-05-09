{
  description = "My Awesome Desktop Shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      ags,
    }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      packages.${system} = {
        default = ags.lib.bundle {
          inherit pkgs;
          src = ./.;
          name = "minui";
          entry = "app.ts";

          # additional libraries and executables to add to gjs' runtime
          extraPackages = [
            ags.packages.${system}.hyprland
            ags.packages.${system}.battery
            ags.packages.${system}.network
            ags.packages.${system}.bluetooth
            # pkgs.fzf
          ];
        };
      };

      devShells.${system} = {
        default = pkgs.mkShell {
          packages = with pkgs; [
            typescript-language-server
            python313
          ] ++ (with pkgs.python313Packages; [
            numpy
            (opencv4.override { enableGtk3 = true; })
            python-lsp-server
          ]);
          buildInputs = [
            # includes astal3 astal4 astal-io by default
            (ags.packages.${system}.default.override {
              extraPackages = [
                # cherry pick packages
                ags.packages.${system}.hyprland
                ags.packages.${system}.battery
                ags.packages.${system}.network
                ags.packages.${system}.bluetooth
              ];
            })
          ];
        };
      };
    };
}
